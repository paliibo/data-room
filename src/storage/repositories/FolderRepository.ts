import type { FileItem, Folder } from "@/types";
import { withStorage } from "@/storage/indexedDb";

export const FolderRepository = {
  async getByDataroom(dataroomId: string): Promise<Folder[]> {
    return withStorage(
      (db) => db.getAllFromIndex("folders", "by-dataroom", dataroomId),
      "Failed to load folders",
    );
  },

  async put(folder: Folder): Promise<void> {
    await withStorage(
      (db) => db.put("folders", folder),
      "Failed to save folder",
    );
  },

  async deleteCascade(
    folders: Folder[],
    files: FileItem[],
  ): Promise<void> {
    await withStorage(async (db) => {
      const tx = db.transaction(["folders", "files", "blobs"], "readwrite");
      await Promise.all([
        ...folders.map((f) => tx.objectStore("folders").delete(f.id)),
        ...files.map((f) => tx.objectStore("files").delete(f.id)),
        ...files.map((f) => tx.objectStore("blobs").delete(f.id)),
      ]);
      await tx.done;
    }, "Failed to delete folder");
  },
};
