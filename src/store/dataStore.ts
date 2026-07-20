import { create } from "zustand";
import type { Dataroom, FileItem, Folder } from "@/types";
import { createId } from "@/lib/utils";
import { ensureUniqueName, isNameTaken, validatePdfFile } from "@/lib/validation";
import type { UploadRejection } from "@/lib/validation";
import { DataroomRepository } from "@/storage/repositories/DataroomRepository";
import { FolderRepository } from "@/storage/repositories/FolderRepository";
import { FileRepository } from "@/storage/repositories/FileRepository";
import type { DataState } from "@/store/types";
import {
  NameConflictError,
  addChild,
  buildChildrenIndex,
  emptyChildren,
  now,
  parentKey,
  removeChild,
  siblingNames,
} from "@/store/utils";

export const useDataStore = create<DataState>()((set, get) => ({
  dataroomsStatus: "idle",
  contentStatus: "idle",
  storageError: null,

  dataroomsById: {},
  dataroomIds: [],

  activeDataroomId: null,
  foldersById: {},
  filesById: {},
  childrenByParent: {},

  async loadDatarooms() {
    set({ dataroomsStatus: "loading", storageError: null });
    try {
      const datarooms = await DataroomRepository.getAll();
      datarooms.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      set({
        dataroomsStatus: "ready",
        dataroomsById: Object.fromEntries(datarooms.map((d) => [d.id, d])),
        dataroomIds: datarooms.map((d) => d.id),
      });
    } catch (error) {
      set({
        dataroomsStatus: "error",
        storageError: error instanceof Error ? error.message : "Failed to load datarooms",
      });
      throw error;
    }
  },

  async openDataroom(dataroomId) {
    if (get().activeDataroomId === dataroomId && get().contentStatus === "ready") {
      return;
    }
    set({
      contentStatus: "loading",
      activeDataroomId: dataroomId,
      foldersById: {},
      filesById: {},
      childrenByParent: {},
    });
    try {
      const [folders, files] = await Promise.all([
        FolderRepository.getByDataroom(dataroomId),
        FileRepository.getByDataroom(dataroomId),
      ]);
      if (get().activeDataroomId !== dataroomId) return;
      set({
        contentStatus: "ready",
        foldersById: Object.fromEntries(folders.map((f) => [f.id, f])),
        filesById: Object.fromEntries(files.map((f) => [f.id, f])),
        childrenByParent: buildChildrenIndex(folders, files),
      });
    } catch (error) {
      if (get().activeDataroomId !== dataroomId) return;
      set({
        contentStatus: "error",
        storageError: error instanceof Error ? error.message : "Failed to load contents",
      });
      throw error;
    }
  },

  async createDataroom(name) {
    const trimmed = name.trim();
    const existing = Object.values(get().dataroomsById).map((d) => d.name);
    if (isNameTaken(trimmed, existing)) {
      throw new NameConflictError(trimmed, "among your datarooms");
    }

    const dataroom: Dataroom = {
      id: createId(),
      name: trimmed,
      createdAt: now(),
      updatedAt: now(),
    };
    await DataroomRepository.put(dataroom);
    set((state) => ({
      dataroomsById: { ...state.dataroomsById, [dataroom.id]: dataroom },
      dataroomIds: [dataroom.id, ...state.dataroomIds],
    }));
    return dataroom;
  },

  async renameDataroom(dataroomId, name) {
    const trimmed = name.trim();
    const state = get();
    const current = state.dataroomsById[dataroomId];
    if (!current) return;
    const otherNames = Object.values(state.dataroomsById).map((d) => d.name);
    if (isNameTaken(trimmed, otherNames, current.name)) {
      throw new NameConflictError(trimmed, "among your datarooms");
    }
    const updated: Dataroom = { ...current, name: trimmed, updatedAt: now() };
    await DataroomRepository.put(updated);
    set((s) => ({
      dataroomsById: { ...s.dataroomsById, [dataroomId]: updated },
    }));
  },

  async deleteDataroom(dataroomId) {
    await DataroomRepository.deleteCascade(dataroomId);
    set((state) => {
      const { [dataroomId]: _removed, ...rest } = state.dataroomsById;
      const isActive = state.activeDataroomId === dataroomId;
      return {
        dataroomsById: rest,
        dataroomIds: state.dataroomIds.filter((id) => id !== dataroomId),
        ...(isActive && {
          activeDataroomId: null,
          contentStatus: "idle" as const,
          foldersById: {},
          filesById: {},
          childrenByParent: {},
        }),
      };
    });
  },

  async createFolder(parentId, name) {
    const state = get();
    const dataroomId = state.activeDataroomId;
    if (!dataroomId) throw new Error("No dataroom is open");
    const trimmed = name.trim();
    if (isNameTaken(trimmed, siblingNames(state, parentId))) {
      throw new NameConflictError(trimmed);
    }
    const folder: Folder = {
      id: createId(),
      dataroomId,
      parentId,
      name: trimmed,
      createdAt: now(),
      updatedAt: now(),
    };
    await FolderRepository.put(folder);
    set((s) => ({
      foldersById: { ...s.foldersById, [folder.id]: folder },
      childrenByParent: addChild(
        s.childrenByParent,
        parentKey(parentId),
        "folderIds",
        folder.id,
      ),
    }));
    return folder;
  },

  async renameFolder(folderId, name) {
    const state = get();
    const folder = state.foldersById[folderId];
    if (!folder) return;
    const trimmed = name.trim();
    if (isNameTaken(trimmed, siblingNames(state, folder.parentId), folder.name)) {
      throw new NameConflictError(trimmed);
    }
    const updated: Folder = { ...folder, name: trimmed, updatedAt: now() };
    await FolderRepository.put(updated);
    set((s) => ({ foldersById: { ...s.foldersById, [folderId]: updated } }));
  },

  async deleteFolder(folderId) {
    const state = get();
    const root = state.foldersById[folderId];
    if (!root) return [];

    const foldersToDelete: Folder[] = [];
    const filesToDelete: FileItem[] = [];
    const queue = [folderId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const folder = state.foldersById[id];
      if (!folder) continue;
      foldersToDelete.push(folder);
      const children = state.childrenByParent[id];
      if (!children) continue;
      queue.push(...children.folderIds);
      for (const fileId of children.fileIds) {
        const file = state.filesById[fileId];
        if (file) filesToDelete.push(file);
      }
    }

    await FolderRepository.deleteCascade(foldersToDelete, filesToDelete);

    const removedFolderIds = new Set(foldersToDelete.map((f) => f.id));
    const removedFileIds = new Set(filesToDelete.map((f) => f.id));
    set((s) => {
      const foldersById = { ...s.foldersById };
      const filesById = { ...s.filesById };
      const childrenByParent = { ...s.childrenByParent };
      for (const id of removedFolderIds) {
        delete foldersById[id];
        delete childrenByParent[id];
      }
      for (const id of removedFileIds) delete filesById[id];
      const rootParent = parentKey(root.parentId);
      childrenByParent[rootParent] = {
        ...(childrenByParent[rootParent] ?? emptyChildren()),
        folderIds: (childrenByParent[rootParent]?.folderIds ?? []).filter(
          (id) => id !== folderId,
        ),
      };
      return { foldersById, filesById, childrenByParent };
    });
    return foldersToDelete.map((f) => f.id);
  },

  async moveFolder(folderId, newParentId) {
    const state = get();
    const folder = state.foldersById[folderId];
    if (!folder || folder.parentId === newParentId || folderId === newParentId) {
      return;
    }
    let cursor = newParentId;
    while (cursor) {
      if (cursor === folderId) {
        throw new Error("Cannot move a folder into itself");
      }
      cursor = state.foldersById[cursor]?.parentId ?? null;
    }
    if (isNameTaken(folder.name, siblingNames(state, newParentId))) {
      throw new NameConflictError(folder.name);
    }
    const updated: Folder = { ...folder, parentId: newParentId, updatedAt: now() };
    await FolderRepository.put(updated);
    set((s) => ({
      foldersById: { ...s.foldersById, [folderId]: updated },
      childrenByParent: addChild(
        removeChild(s.childrenByParent, parentKey(folder.parentId), "folderIds", folderId),
        parentKey(newParentId),
        "folderIds",
        folderId,
      ),
    }));
  },

  async uploadFiles(parentId, incoming) {
    const state = get();
    const dataroomId = state.activeDataroomId;
    if (!dataroomId) throw new Error("No dataroom is open");

    const uploaded: FileItem[] = [];
    const rejected: UploadRejection[] = [];
    const takenNames = siblingNames(state, parentId);

    for (const file of incoming) {
      const rejection = validatePdfFile(file);
      if (rejection) {
        rejected.push(rejection);
        continue;
      }
      const name = ensureUniqueName(file.name, takenNames);
      takenNames.push(name);
      const item: FileItem = {
        id: createId(),
        dataroomId,
        parentId,
        name,
        originalFilename: file.name,
        size: file.size,
        mimeType: file.type || "application/pdf",
        uploadedAt: now(),
        updatedAt: now(),
      };
      try {
        await FileRepository.putWithBlob(item, file);
        uploaded.push(item);
      } catch (error) {
        rejected.push({
          file,
          reason: error instanceof Error ? error.message : "Failed to store file",
        });
      }
    }

    if (uploaded.length > 0) {
      set((s) => {
        let childrenByParent = s.childrenByParent;
        const filesById = { ...s.filesById };
        for (const item of uploaded) {
          filesById[item.id] = item;
          childrenByParent = addChild(
            childrenByParent,
            parentKey(parentId),
            "fileIds",
            item.id,
          );
        }
        return { filesById, childrenByParent };
      });
    }
    return { uploaded, rejected };
  },

  async renameFile(fileId, name) {
    const state = get();
    const file = state.filesById[fileId];
    if (!file) return;
    const trimmed = name.trim();
    if (isNameTaken(trimmed, siblingNames(state, file.parentId), file.name)) {
      throw new NameConflictError(trimmed);
    }
    const updated: FileItem = { ...file, name: trimmed, updatedAt: now() };
    await FileRepository.put(updated);
    set((s) => ({ filesById: { ...s.filesById, [fileId]: updated } }));
  },

  async deleteFile(fileId) {
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
  },

  async moveFile(fileId, newParentId) {
    const state = get();
    const file = state.filesById[fileId];
    if (!file || file.parentId === newParentId) return;
    const name = ensureUniqueName(file.name, siblingNames(state, newParentId));
    const updated: FileItem = {
      ...file,
      parentId: newParentId,
      name,
      updatedAt: now(),
    };
    await FileRepository.put(updated);
    set((s) => ({
      filesById: { ...s.filesById, [fileId]: updated },
      childrenByParent: addChild(
        removeChild(s.childrenByParent, parentKey(file.parentId), "fileIds", fileId),
        parentKey(newParentId),
        "fileIds",
        fileId,
      ),
    }));
  },
}));
