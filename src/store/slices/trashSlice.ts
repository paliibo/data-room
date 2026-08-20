import type { StateCreator } from "zustand";
import type { FileItem, Folder } from "@/types";
import { FolderRepository } from "@/storage/repositories/FolderRepository";
import { FileRepository } from "@/storage/repositories/FileRepository";
import type { DataState, TrashResult, TrashSlice } from "@/store/types";
import { collectSubtree, now, removeChild, parentKey } from "@/store/utils";

/**
 * Deleting is a two-step ritual: items are stamped with `deletedAt` and stay in
 * the tree (so restore is a single field flip and undo is free), and only
 * purging actually drops rows and blobs.
 */
export const createTrashSlice: StateCreator<DataState, [], [], TrashSlice> = (
  set,
  get,
) => {
  /** Stamps a set of folders/files as trashed and persists them together. */
  const stamp = async (
    folders: Folder[],
    files: FileItem[],
    deletedAt: string | null,
  ): Promise<TrashResult> => {
    const timestamp = now();
    const nextFolders = folders.map((f) => ({ ...f, deletedAt, updatedAt: timestamp }));
    const nextFiles = files.map((f) => ({ ...f, deletedAt, updatedAt: timestamp }));
    await FolderRepository.putMany(nextFolders, nextFiles);
    set((s) => ({
      foldersById: {
        ...s.foldersById,
        ...Object.fromEntries(nextFolders.map((f) => [f.id, f])),
      },
      filesById: {
        ...s.filesById,
        ...Object.fromEntries(nextFiles.map((f) => [f.id, f])),
      },
    }));
    return {
      folderIds: nextFolders.map((f) => f.id),
      fileIds: nextFiles.map((f) => f.id),
    };
  };

  return {
    async trashFolder(folderId) {
      const state = get();
      const folder = state.foldersById[folderId];
      if (!folder) return { folderIds: [], fileIds: [] };
      const { folders, files } = collectSubtree(state, folderId);
      const result = await stamp(folders, files, now());
      await get().logActivity({
        type: "folder.trash",
        targetId: folderId,
        targetName: folder.name,
        detail:
          files.length > 0
            ? `with ${files.length} file${files.length === 1 ? "" : "s"}`
            : "",
      });
      return result;
    },

    async trashFile(fileId) {
      const file = get().filesById[fileId];
      if (!file) return { folderIds: [], fileIds: [] };
      const result = await stamp([], [file], now());
      await get().logActivity({
        type: "file.trash",
        targetId: fileId,
        targetName: file.name,
      });
      return result;
    },

    /** Bulk delete: subtrees are unioned so nested selections are not stamped twice. */
    async trashMany(folderIds, fileIds) {
      const state = get();
      const folders = new Map<string, Folder>();
      const files = new Map<string, FileItem>();

      for (const id of folderIds) {
        const subtree = collectSubtree(state, id);
        for (const folder of subtree.folders) folders.set(folder.id, folder);
        for (const file of subtree.files) files.set(file.id, file);
      }
      for (const id of fileIds) {
        const file = state.filesById[id];
        if (file) files.set(file.id, file);
      }

      const result = await stamp([...folders.values()], [...files.values()], now());
      const count = folderIds.length + fileIds.length;
      await get().logActivity({
        type: "file.trash",
        targetName: `${count} item${count === 1 ? "" : "s"}`,
      });
      return result;
    },

    async restore({ folderIds, fileIds }) {
      const state = get();
      const folders = folderIds
        .map((id) => state.foldersById[id])
        .filter((f): f is Folder => Boolean(f));
      const files = fileIds
        .map((id) => state.filesById[id])
        .filter((f): f is FileItem => Boolean(f));
      if (folders.length === 0 && files.length === 0) return;

      await stamp(folders, files, null);
      const name = folders[0]?.name ?? files[0]?.name ?? "items";
      const total = folders.length + files.length;
      await get().logActivity({
        // A mixed restore is reported as a file restore so the verb reads
        // "restored 24 items" rather than "restored folder 24 items".
        type: total === 1 && folders.length > 0 ? "folder.restore" : "file.restore",
        targetName: total === 1 ? name : `${total} items`,
      });
    },

    async purgeFolder(folderId) {
      const state = get();
      const root = state.foldersById[folderId];
      if (!root) return;
      const { folders, files } = collectSubtree(state, folderId);
      await FolderRepository.deleteCascade(folders, files);

      const removedFolders = new Set(folders.map((f) => f.id));
      const removedFiles = new Set(files.map((f) => f.id));
      set((s) => {
        const foldersById = { ...s.foldersById };
        const filesById = { ...s.filesById };
        let childrenByParent = { ...s.childrenByParent };
        for (const id of removedFolders) {
          delete foldersById[id];
          delete childrenByParent[id];
        }
        for (const id of removedFiles) delete filesById[id];
        childrenByParent = removeChild(
          childrenByParent,
          parentKey(root.parentId),
          "folderIds",
          folderId,
        );
        return { foldersById, filesById, childrenByParent };
      });
      await get().logActivity({
        type: "file.delete",
        targetName: root.name,
        detail: "deleted permanently",
      });
    },

    async purgeFile(fileId) {
      const file = get().filesById[fileId];
      if (!file) return;
      await FileRepository.delete(fileId);
      set((s) => {
        const { [fileId]: _removed, ...filesById } = s.filesById;
        return {
          filesById,
          childrenByParent: removeChild(
            s.childrenByParent,
            parentKey(file.parentId),
            "fileIds",
            fileId,
          ),
        };
      });
      await get().logActivity({
        type: "file.delete",
        targetName: file.name,
        detail: "deleted permanently",
      });
    },

    /** Purges every trashed item in the open room; returns how many were removed. */
    async emptyTrash() {
      const state = get();
      const folders = Object.values(state.foldersById).filter((f) => f.deletedAt);
      const files = Object.values(state.filesById).filter((f) => f.deletedAt);
      if (folders.length === 0 && files.length === 0) return 0;

      await FolderRepository.deleteCascade(folders, files);
      const removedFolders = new Set(folders.map((f) => f.id));
      const removedFiles = new Set(files.map((f) => f.id));

      set((s) => {
        const foldersById = { ...s.foldersById };
        const filesById = { ...s.filesById };
        for (const id of removedFolders) delete foldersById[id];
        for (const id of removedFiles) delete filesById[id];
        return {
          foldersById,
          filesById,
          childrenByParent: Object.fromEntries(
            Object.entries(s.childrenByParent)
              .filter(([key]) => !removedFolders.has(key))
              .map(([key, children]) => [
                key,
                {
                  folderIds: children.folderIds.filter((id) => !removedFolders.has(id)),
                  fileIds: children.fileIds.filter((id) => !removedFiles.has(id)),
                },
              ]),
          ),
        };
      });

      const total = folders.length + files.length;
      await get().logActivity({
        type: "file.delete",
        targetName: `${total} item${total === 1 ? "" : "s"}`,
        detail: "trash emptied",
      });
      return total;
    },
  };
};
