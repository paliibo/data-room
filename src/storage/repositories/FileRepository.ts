import type { FileItem } from "@/types";
import { withStorage } from "@/storage/indexedDb";
import { normalizeFile } from "@/storage/normalize";

export const FileRepository = {
  async getByDataroom(dataroomId: string): Promise<FileItem[]> {
    const rows = await withStorage(
      (db) => db.getAllFromIndex("files", "by-dataroom", dataroomId),
      "Failed to load files",
    );
    return rows.map(normalizeFile);
  },

  async putWithBlob(file: FileItem, blob: Blob): Promise<void> {
    await withStorage(async (db) => {
      const tx = db.transaction(["files", "blobs"], "readwrite");
      await Promise.all([
        tx.objectStore("files").put(file),
        tx.objectStore("blobs").put(blob, file.id),
      ]);
      await tx.done;
    }, "Failed to save file");
  },

  async put(file: FileItem): Promise<void> {
    await withStorage((db) => db.put("files", file), "Failed to save file");
  },

  async putMany(files: FileItem[]): Promise<void> {
    await withStorage(async (db) => {
      const tx = db.transaction("files", "readwrite");
      await Promise.all(files.map((f) => tx.store.put(f)));
      await tx.done;
    }, "Failed to save files");
  },

  async getBlob(fileId: string): Promise<Blob | undefined> {
    return withStorage(
      (db) => db.get("blobs", fileId),
      "Failed to read file content",
    );
  },

  async delete(fileId: string): Promise<void> {
    await withStorage(async (db) => {
      const tx = db.transaction(["files", "blobs"], "readwrite");
      await Promise.all([
        tx.objectStore("files").delete(fileId),
        tx.objectStore("blobs").delete(fileId),
      ]);
      await tx.done;
    }, "Failed to delete file");
  },

  async deleteMany(fileIds: string[]): Promise<void> {
    await withStorage(async (db) => {
      const tx = db.transaction(["files", "blobs"], "readwrite");
      await Promise.all([
        ...fileIds.map((id) => tx.objectStore("files").delete(id)),
        ...fileIds.map((id) => tx.objectStore("blobs").delete(id)),
      ]);
      await tx.done;
    }, "Failed to delete files");
  },
};
