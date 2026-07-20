import type { Dataroom } from "@/types";
import { withStorage } from "@/storage/indexedDb";

export const DataroomRepository = {
  async getAll(): Promise<Dataroom[]> {
    return withStorage(
      (db) => db.getAll("datarooms"),
      "Failed to load datarooms",
    );
  },

  async put(dataroom: Dataroom): Promise<void> {
    await withStorage(
      (db) => db.put("datarooms", dataroom),
      "Failed to save dataroom",
    );
  },

  async deleteCascade(dataroomId: string): Promise<void> {
    await withStorage(async (db) => {
      const tx = db.transaction(
        ["datarooms", "folders", "files", "blobs"],
        "readwrite",
      );
      const fileIds = await tx
        .objectStore("files")
        .index("by-dataroom")
        .getAllKeys(dataroomId);
      const folderIds = await tx
        .objectStore("folders")
        .index("by-dataroom")
        .getAllKeys(dataroomId);

      await Promise.all([
        tx.objectStore("datarooms").delete(dataroomId),
        ...folderIds.map((id) => tx.objectStore("folders").delete(id)),
        ...fileIds.map((id) => tx.objectStore("files").delete(id)),
        ...fileIds.map((id) => tx.objectStore("blobs").delete(id)),
      ]);
      await tx.done;
    }, "Failed to delete dataroom");
  },
};
