import { describe, expect, it } from "vitest";
import {
  ROOT_PARENT_KEY,
  addChild,
  ancestorsOf,
  buildChildrenIndex,
  collectSubtree,
  isTrashRoot,
  parentKey,
  removeChild,
  siblingNames,
} from "@/store/utils";
import { makeFile, makeFolder } from "@/test/factories";

/** Root + two levels: root > "Corporate" > "Minutes", each holding one file. */
function tree() {
  const corporate = makeFolder({ id: "corporate", name: "Corporate" });
  const minutes = makeFolder({ id: "minutes", name: "Minutes", parentId: "corporate" });
  const rootFile = makeFile({ id: "root-file", name: "Index.pdf" });
  const corporateFile = makeFile({ id: "corp-file", name: "Bylaws.pdf", parentId: "corporate" });
  const minutesFile = makeFile({ id: "min-file", name: "2025.pdf", parentId: "minutes" });

  const folders = [corporate, minutes];
  const files = [rootFile, corporateFile, minutesFile];
  return {
    corporate,
    minutes,
    foldersById: Object.fromEntries(folders.map((f) => [f.id, f])),
    filesById: Object.fromEntries(files.map((f) => [f.id, f])),
    childrenByParent: buildChildrenIndex(folders, files),
  };
}

describe("parentKey", () => {
  it("maps the root to a stable sentinel", () => {
    expect(parentKey(null)).toBe(ROOT_PARENT_KEY);
    expect(parentKey("corporate")).toBe("corporate");
  });
});

describe("buildChildrenIndex", () => {
  it("buckets folders and files under their parent", () => {
    const { childrenByParent } = tree();
    expect(childrenByParent[ROOT_PARENT_KEY]).toEqual({
      folderIds: ["corporate"],
      fileIds: ["root-file"],
    });
    expect(childrenByParent.corporate).toEqual({
      folderIds: ["minutes"],
      fileIds: ["corp-file"],
    });
  });
});

describe("addChild / removeChild", () => {
  it("does not mutate the index it is given", () => {
    const index = { a: { folderIds: [], fileIds: [] } };
    const next = addChild(index, "a", "fileIds", "f1");
    expect(index.a.fileIds).toEqual([]);
    expect(next.a.fileIds).toEqual(["f1"]);
  });

  it("creates a missing bucket on add", () => {
    expect(addChild({}, "new", "folderIds", "x").new).toEqual({
      folderIds: ["x"],
      fileIds: [],
    });
  });

  it("is a no-op when removing from a bucket that does not exist", () => {
    const index = {};
    expect(removeChild(index, "missing", "fileIds", "x")).toBe(index);
  });
});

describe("siblingNames", () => {
  it("lists live folder and file names under a parent", () => {
    const state = tree();
    expect(siblingNames(state, null).sort()).toEqual(["Corporate", "Index.pdf"]);
  });

  it("excludes trashed siblings so a deleted name can be reused", () => {
    const state = tree();
    state.foldersById.corporate = { ...state.corporate, deletedAt: "2026-01-01T00:00:00.000Z" };
    expect(siblingNames(state, null)).toEqual(["Index.pdf"]);
  });

  it("returns nothing for an unknown parent", () => {
    expect(siblingNames(tree(), "nope")).toEqual([]);
  });
});

describe("collectSubtree", () => {
  it("includes the root folder and everything beneath it", () => {
    const { folders, files } = collectSubtree(tree(), "corporate");
    expect(folders.map((f) => f.id).sort()).toEqual(["corporate", "minutes"]);
    expect(files.map((f) => f.id).sort()).toEqual(["corp-file", "min-file"]);
  });

  it("returns nothing for a folder that does not exist", () => {
    expect(collectSubtree(tree(), "ghost")).toEqual({ folders: [], files: [] });
  });

  it("terminates on a corrupt parent cycle", () => {
    const a = makeFolder({ id: "a", parentId: "b" });
    const b = makeFolder({ id: "b", parentId: "a" });
    const state = {
      foldersById: { a, b },
      filesById: {},
      childrenByParent: { a: { folderIds: ["b"], fileIds: [] }, b: { folderIds: ["a"], fileIds: [] } },
    };
    expect(collectSubtree(state, "a").folders).toHaveLength(2);
  });
});

describe("ancestorsOf", () => {
  it("walks parent pointers up to the root", () => {
    const { foldersById } = tree();
    expect(ancestorsOf(foldersById, "minutes")).toEqual(["corporate"]);
  });

  it("returns nothing for a top-level folder", () => {
    expect(ancestorsOf(tree().foldersById, "corporate")).toEqual([]);
  });

  it("terminates on a cycle instead of hanging", () => {
    const a = makeFolder({ id: "a", parentId: "b" });
    const b = makeFolder({ id: "b", parentId: "a" });
    expect(ancestorsOf({ a, b }, "a")).toEqual(["b", "a"]);
  });
});

describe("isTrashRoot", () => {
  const deletedAt = "2026-01-01T00:00:00.000Z";

  it("is false for a live item", () => {
    const state = tree();
    expect(isTrashRoot(state, state.corporate)).toBe(false);
  });

  it("is true for a trashed top-level item", () => {
    const state = tree();
    expect(isTrashRoot(state, { ...state.corporate, deletedAt })).toBe(true);
  });

  it("is false for a child trashed alongside its parent", () => {
    // Otherwise one delete would appear once per nested item in the trash view.
    const state = tree();
    state.foldersById.corporate = { ...state.corporate, deletedAt };
    expect(isTrashRoot(state, { ...state.minutes, deletedAt })).toBe(false);
  });

  it("is true for a child trashed on its own inside a live parent", () => {
    const state = tree();
    expect(isTrashRoot(state, { ...state.minutes, deletedAt })).toBe(true);
  });
});
