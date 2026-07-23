import type { Dataroom } from "@/types";
import { withStorage } from "@/storage/indexedDb";
import { normalizeDataroom } from "@/storage/normalize";

export const DataroomRepository = {
  async getAll(): Promise<Dataroom[]> {
    const rows = await withStorage(
      (db) => db.getAll("datarooms"),
      "Failed to load datarooms",
    );
    return rows.map(normalizeDataroom);
  },

  async get(dataroomId: string): Promise<Dataroom | undefined> {
    const row = await withStorage(
      (db) => db.get("datarooms", dataroomId),
      "Failed to load dataroom",
    );
    return row && normalizeDataroom(row);
  },

  async put(dataroom: Dataroom): Promise<void> {
    await withStorage(
      (db) => db.put("datarooms", dataroom),
      "Failed to save dataroom",
    );
  },

  /**
   * Removes the room and everything that belongs to it in a single transaction,
   * so an interrupted delete can never strand folders, blobs or share links.
   */
  async deleteCascade(dataroomId: string): Promise<void> {
    await withStorage(async (db) => {
      const tx = db.transaction(
        [
          "datarooms",
          "folders",
          "files",
          "blobs",
          "tags",
          "shareLinks",
          "activity",
          "checklist",
        ],
        "readwrite",
      );
      const byRoom = async (store: "folders" | "files" | "tags" | "shareLinks" | "activity" | "checklist") =>
        tx.objectStore(store).index("by-dataroom").getAllKeys(dataroomId);

      const [fileIds, folderIds, tagIds, shareIds, activityIds, checklistIds] =
        await Promise.all([
          byRoom("files"),
          byRoom("folders"),
          byRoom("tags"),
          byRoom("shareLinks"),
          byRoom("activity"),
          byRoom("checklist"),
        ]);

      await Promise.all([
        tx.objectStore("datarooms").delete(dataroomId),
        ...folderIds.map((id) => tx.objectStore("folders").delete(id)),
        ...fileIds.map((id) => tx.objectStore("files").delete(id)),
        ...fileIds.map((id) => tx.objectStore("blobs").delete(id)),
        ...tagIds.map((id) => tx.objectStore("tags").delete(id)),
        ...shareIds.map((id) => tx.objectStore("shareLinks").delete(id)),
        ...activityIds.map((id) => tx.objectStore("activity").delete(id)),
        ...checklistIds.map((id) => tx.objectStore("checklist").delete(id)),
      ]);
      await tx.done;
    }, "Failed to delete dataroom");
  },
};
