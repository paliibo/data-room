import { beforeEach, describe, expect, it } from "vitest";
import { useDataStore } from "@/store/dataStore";
import { destroyDatabase, resetDbConnection } from "@/storage/indexedDb";
import { FileRepository } from "@/storage/repositories/FileRepository";
import { ShareLinkRepository } from "@/storage/repositories/ShareLinkRepository";
import { NameConflictError, isTrashRoot } from "@/store/utils";
import { makePdfFile } from "@/test/factories";

const store = () => useDataStore.getState();

/** Fresh database and a fresh open room before every test. */
async function freshRoom(name = "Project Atlas") {
  const room = await store().createDataroom(name, "A test deal");
  await store().openDataroom(room.id);
  return room;
}

beforeEach(async () => {
  await destroyDatabase();
  resetDbConnection();
  // Actions live on the same object, so a partial reset of the data fields is
  // enough — setState merges and leaves the slices' functions in place.
  useDataStore.setState({
    dataroomsStatus: "idle",
    contentStatus: "idle",
    storageError: null,
    dataroomsById: {},
    dataroomIds: [],
    activeDataroomId: null,
    foldersById: {},
    filesById: {},
    childrenByParent: {},
    tagsById: {},
    tagIds: [],
    sharesById: {},
    shareIds: [],
    activity: [],
    checklistById: {},
    checklistIds: [],
  });
});

describe("datarooms", () => {
  it("creates a room and persists it across a reload", async () => {
    const room = await freshRoom();
    useDataStore.setState({ dataroomsById: {}, dataroomIds: [], dataroomsStatus: "idle" });

    await store().loadDatarooms();
    expect(store().dataroomIds).toEqual([room.id]);
    expect(store().dataroomsById[room.id].description).toBe("A test deal");
  });

  it("blocks a duplicate room name regardless of case", async () => {
    await freshRoom("Atlas");
    await expect(store().createDataroom("atlas")).rejects.toBeInstanceOf(NameConflictError);
  });

  it("cascades a delete across folders, files and blobs", async () => {
    const room = await freshRoom();
    const folder = await store().createFolder(null, "Corporate");
    const { uploaded } = await store().uploadFiles(folder.id, [makePdfFile()]);

    await store().deleteDataroom(room.id);

    expect(store().dataroomIds).toEqual([]);
    expect(await FileRepository.getByDataroom(room.id)).toEqual([]);
    expect(await FileRepository.getBlob(uploaded[0].id)).toBeUndefined();
  });
});

describe("folders", () => {
  it("rejects a duplicate name among live siblings", async () => {
    await freshRoom();
    await store().createFolder(null, "Corporate");
    await expect(store().createFolder(null, "corporate")).rejects.toBeInstanceOf(
      NameConflictError,
    );
  });

  it("frees a name once the folder is trashed", async () => {
    await freshRoom();
    const folder = await store().createFolder(null, "Corporate");
    await store().trashFolder(folder.id);
    await expect(store().createFolder(null, "Corporate")).resolves.toBeDefined();
  });

  it("refuses to move a folder into its own subtree", async () => {
    await freshRoom();
    const parent = await store().createFolder(null, "Corporate");
    const child = await store().createFolder(parent.id, "Minutes");
    await expect(store().moveFolder(parent.id, child.id)).rejects.toThrow(/into itself/i);
  });

  it("reindexes children when a folder moves", async () => {
    await freshRoom();
    const a = await store().createFolder(null, "A");
    const b = await store().createFolder(null, "B");
    const child = await store().createFolder(a.id, "Child");

    await store().moveFolder(child.id, b.id);

    expect(store().childrenByParent[a.id].folderIds).toEqual([]);
    expect(store().childrenByParent[b.id].folderIds).toEqual([child.id]);
    expect(store().foldersById[child.id].parentId).toBe(b.id);
  });
});

describe("uploads", () => {
  it("stores metadata and blob together", async () => {
    await freshRoom();
    const { uploaded, rejected } = await store().uploadFiles(null, [makePdfFile("Report.pdf")]);

    expect(rejected).toEqual([]);
    expect(uploaded[0].name).toBe("Report.pdf");
    // fake-indexeddb round-trips through structuredClone, which does not carry
    // the jsdom Blob prototype across — assert on presence, not on the class.
    expect(await FileRepository.getBlob(uploaded[0].id)).toBeDefined();
  });

  it("auto-suffixes a colliding upload rather than failing the batch", async () => {
    await freshRoom();
    await store().uploadFiles(null, [makePdfFile("Report.pdf")]);
    const { uploaded } = await store().uploadFiles(null, [makePdfFile("Report.pdf")]);
    expect(uploaded[0].name).toBe("Report (2).pdf");
  });

  it("suffixes within a single batch too", async () => {
    await freshRoom();
    const { uploaded } = await store().uploadFiles(null, [
      makePdfFile("Report.pdf"),
      makePdfFile("Report.pdf"),
    ]);
    expect(uploaded.map((f) => f.name)).toEqual(["Report.pdf", "Report (2).pdf"]);
  });

  it("rejects non-PDFs but keeps the valid ones", async () => {
    await freshRoom();
    const png = new File([new Uint8Array(10)], "logo.png", { type: "image/png" });
    const { uploaded, rejected } = await store().uploadFiles(null, [makePdfFile(), png]);

    expect(uploaded).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/only pdf/i);
  });

  it("records one activity event per uploaded file", async () => {
    await freshRoom();
    await store().uploadFiles(null, [makePdfFile("A.pdf"), makePdfFile("B.pdf")]);
    expect(store().activity.filter((e) => e.type === "file.upload")).toHaveLength(2);
  });
});

describe("trash", () => {
  it("marks a whole subtree deleted without removing it", async () => {
    await freshRoom();
    const parent = await store().createFolder(null, "Corporate");
    const child = await store().createFolder(parent.id, "Minutes");
    const { uploaded } = await store().uploadFiles(child.id, [makePdfFile()]);

    const result = await store().trashFolder(parent.id);

    expect(result.folderIds.sort()).toEqual([child.id, parent.id].sort());
    expect(result.fileIds).toEqual([uploaded[0].id]);
    expect(store().foldersById[child.id].deletedAt).not.toBeNull();
    // Still present — soft delete is what makes undo free.
    expect(store().filesById[uploaded[0].id]).toBeDefined();
  });

  it("shows only the top of a trashed subtree in the trash view", async () => {
    await freshRoom();
    const parent = await store().createFolder(null, "Corporate");
    const child = await store().createFolder(parent.id, "Minutes");
    await store().trashFolder(parent.id);

    const state = store();
    expect(isTrashRoot(state, state.foldersById[parent.id])).toBe(true);
    expect(isTrashRoot(state, state.foldersById[child.id])).toBe(false);
  });

  it("restores exactly what a trash call reported", async () => {
    await freshRoom();
    const folder = await store().createFolder(null, "Corporate");
    const { uploaded } = await store().uploadFiles(folder.id, [makePdfFile()]);

    const result = await store().trashFolder(folder.id);
    await store().restore(result);

    expect(store().foldersById[folder.id].deletedAt).toBeNull();
    expect(store().filesById[uploaded[0].id].deletedAt).toBeNull();
  });

  it("does not double-stamp a nested selection", async () => {
    await freshRoom();
    const parent = await store().createFolder(null, "Corporate");
    const child = await store().createFolder(parent.id, "Minutes");

    const result = await store().trashMany([parent.id, child.id], []);
    expect(result.folderIds).toHaveLength(2);
  });

  it("purges a subtree and its blobs for good", async () => {
    await freshRoom();
    const folder = await store().createFolder(null, "Corporate");
    const { uploaded } = await store().uploadFiles(folder.id, [makePdfFile()]);

    await store().trashFolder(folder.id);
    await store().purgeFolder(folder.id);

    expect(store().foldersById[folder.id]).toBeUndefined();
    expect(store().filesById[uploaded[0].id]).toBeUndefined();
    expect(await FileRepository.getBlob(uploaded[0].id)).toBeUndefined();
  });

  it("empties the trash and leaves live items alone", async () => {
    await freshRoom();
    const kept = await store().createFolder(null, "Keep");
    const dropped = await store().createFolder(null, "Drop");
    await store().trashFolder(dropped.id);

    const count = await store().emptyTrash();

    expect(count).toBe(1);
    expect(store().foldersById[kept.id]).toBeDefined();
    expect(store().foldersById[dropped.id]).toBeUndefined();
    expect(store().childrenByParent.__root__.folderIds).toEqual([kept.id]);
  });
});

describe("tags", () => {
  it("detaches a deleted tag from every file that carried it", async () => {
    await freshRoom();
    const tag = await store().createTag("Confidential", "rose");
    const { uploaded } = await store().uploadFiles(null, [makePdfFile()]);
    await store().setFileTags(uploaded[0].id, [tag.id]);

    await store().deleteTag(tag.id);

    expect(store().tagsById[tag.id]).toBeUndefined();
    expect(store().filesById[uploaded[0].id].tagIds).toEqual([]);
  });

  it("drops tag ids that no longer exist", async () => {
    await freshRoom();
    const { uploaded } = await store().uploadFiles(null, [makePdfFile()]);
    await store().setFileTags(uploaded[0].id, ["ghost-tag"]);
    expect(store().filesById[uploaded[0].id].tagIds).toEqual([]);
  });
});

describe("share links", () => {
  it("creates a resolvable token with the requested policy", async () => {
    await freshRoom();
    const link = await store().createShareLink({
      label: "Counsel",
      folderId: null,
      expiresInDays: 30,
      passcode: "atlas",
      allowDownload: false,
      watermark: true,
    });

    const stored = await ShareLinkRepository.getByToken(link.token);
    expect(stored).toMatchObject({ passcode: "atlas", allowDownload: false, watermark: true });
    expect(Date.parse(stored!.expiresAt!)).toBeGreaterThan(Date.now());
  });

  it("treats an empty passcode as no passcode", async () => {
    await freshRoom();
    const link = await store().createShareLink({
      label: "Open",
      folderId: null,
      expiresInDays: null,
      passcode: "   ",
      allowDownload: true,
      watermark: false,
    });
    expect(link.passcode).toBeNull();
    expect(link.expiresAt).toBeNull();
  });

  it("counts a view and logs it against the room", async () => {
    await freshRoom();
    const link = await store().createShareLink({
      label: "Counsel",
      folderId: null,
      expiresInDays: 7,
      passcode: null,
      allowDownload: true,
      watermark: false,
    });

    await store().registerShareView(link.token);

    expect(store().sharesById[link.id].viewCount).toBe(1);
    expect(store().activity.some((e) => e.type === "share.view")).toBe(true);
  });

  it("revoking is idempotent and keeps the original timestamp", async () => {
    await freshRoom();
    const link = await store().createShareLink({
      label: "Counsel",
      folderId: null,
      expiresInDays: 7,
      passcode: null,
      allowDownload: true,
      watermark: false,
    });

    await store().revokeShareLink(link.id);
    const first = store().sharesById[link.id].revokedAt;
    await store().revokeShareLink(link.id);

    expect(store().sharesById[link.id].revokedAt).toBe(first);
  });
});

describe("checklist", () => {
  it("skips titles that already exist when seeding", async () => {
    await freshRoom();
    await store().createChecklistItem("Cap table", "Corporate");
    await store().seedChecklist([
      { title: "cap table", category: "Corporate" },
      { title: "Board minutes", category: "Corporate" },
    ]);
    expect(store().checklistIds).toHaveLength(2);
  });

  it("logs a status change but not a no-op update", async () => {
    await freshRoom();
    const item = await store().createChecklistItem("Cap table", "Corporate");

    await store().updateChecklistItem(item.id, { status: "requested" });
    expect(store().activity.filter((e) => e.type === "checklist.status")).toHaveLength(0);

    await store().updateChecklistItem(item.id, { status: "complete" });
    expect(store().activity.filter((e) => e.type === "checklist.status")).toHaveLength(1);
  });
});

describe("activity", () => {
  it("keeps the feed newest-first even for backdated batches", async () => {
    await freshRoom();
    await store().logActivity([
      { type: "file.view", targetName: "Old", at: "2020-01-01T00:00:00.000Z" },
      { type: "file.view", targetName: "New", at: "2030-01-01T00:00:00.000Z" },
    ]);
    const dates = store().activity.map((e) => e.at);
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });

  it("clears only the open room's log", async () => {
    await freshRoom();
    await store().createFolder(null, "Corporate");
    expect(store().activity.length).toBeGreaterThan(0);

    await store().clearActivity();
    expect(store().activity).toEqual([]);
  });
});
