import type { FileItem, Folder } from "@/types";
import { withStorage } from "@/storage/indexedDb";
import { normalizeFolder } from "@/storage/normalize";

export const FolderRepository = {
  async getByDataroom(dataroomId: string): Promise<Folder[]> {
    const rows = await withStorage(
      (db) => db.getAllFromIndex("folders", "by-dataroom", dataroomId),
      "Failed to load folders",
    );
    return rows.map(normalizeFolder);
  },

  async put(folder: Folder): Promise<void> {
    await withStorage((db) => db.put("folders", folder), "Failed to save folder");
  },

  /** Writes a whole subtree's trash/restore state atomically. */
  async putMany(folders: Folder[], files: FileItem[]): Promise<void> {
    await withStorage(async (db) => {
      const tx = db.transaction(["folders", "files"], "readwrite");
      await Promise.all([
        ...folders.map((f) => tx.objectStore("folders").put(f)),
        ...files.map((f) => tx.objectStore("files").put(f)),
      ]);
      await tx.done;
    }, "Failed to update folder contents");
  },

  async deleteCascade(folders: Folder[], files: FileItem[]): Promise<void> {
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
