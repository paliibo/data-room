import type { StateCreator } from "zustand";
import type { Dataroom, FileItem, Folder } from "@/types";
import { createId } from "@/lib/utils";
import { accentFromSeed } from "@/lib/accent";
import { ensureUniqueName, isNameTaken, validatePdfFile } from "@/lib/validation";
import type { UploadRejection } from "@/lib/validation";
import { DataroomRepository } from "@/storage/repositories/DataroomRepository";
import { FolderRepository } from "@/storage/repositories/FolderRepository";
import { FileRepository } from "@/storage/repositories/FileRepository";
import { TagRepository } from "@/storage/repositories/TagRepository";
import { ShareLinkRepository } from "@/storage/repositories/ShareLinkRepository";
import { ActivityRepository } from "@/storage/repositories/ActivityRepository";
import { ChecklistRepository } from "@/storage/repositories/ChecklistRepository";
import type { CoreSlice, DataState } from "@/store/types";
import {
  NameConflictError,
  addChild,
  ancestorsOf,
  buildChildrenIndex,
  now,
  parentKey,
  removeChild,
  siblingNames,
} from "@/store/utils";

export const createCoreSlice: StateCreator<DataState, [], [], CoreSlice> = (
  set,
  get,
) => ({
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

  /**
   * Hydrates one room at a time. Every read is keyed by `by-dataroom`, so memory
   * stays proportional to what is on screen rather than to total storage.
   */
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
      tagsById: {},
      tagIds: [],
      sharesById: {},
      shareIds: [],
      activity: [],
      checklistById: {},
      checklistIds: [],
    });
    try {
      const [folders, files, tags, shares, activity, checklist] = await Promise.all([
        FolderRepository.getByDataroom(dataroomId),
        FileRepository.getByDataroom(dataroomId),
        TagRepository.getByDataroom(dataroomId),
        ShareLinkRepository.getByDataroom(dataroomId),
        ActivityRepository.getByDataroom(dataroomId),
        ChecklistRepository.getByDataroom(dataroomId),
      ]);
      // A fast room switch can land a stale response after a newer one.
      if (get().activeDataroomId !== dataroomId) return;

      shares.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      checklist.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      set({
        contentStatus: "ready",
        foldersById: Object.fromEntries(folders.map((f) => [f.id, f])),
        filesById: Object.fromEntries(files.map((f) => [f.id, f])),
        childrenByParent: buildChildrenIndex(folders, files),
        tagsById: Object.fromEntries(tags.map((t) => [t.id, t])),
        tagIds: tags.map((t) => t.id),
        sharesById: Object.fromEntries(shares.map((s) => [s.id, s])),
        shareIds: shares.map((s) => s.id),
        activity,
        checklistById: Object.fromEntries(checklist.map((c) => [c.id, c])),
        checklistIds: checklist.map((c) => c.id),
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

  async createDataroom(name, description = "", accent) {
    const trimmed = name.trim();
    const existing = Object.values(get().dataroomsById).map((d) => d.name);
    if (isNameTaken(trimmed, existing)) {
      throw new NameConflictError(trimmed, "among your datarooms");
    }

    const dataroom: Dataroom = {
      id: createId(),
      name: trimmed,
      description: description.trim(),
      accent: accent ?? accentFromSeed(trimmed),
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
    await get().updateDataroom(dataroomId, { name });
  },

  async updateDataroom(dataroomId, patch) {
    const state = get();
    const current = state.dataroomsById[dataroomId];
    if (!current) return;

    const name = patch.name?.trim() ?? current.name;
    if (patch.name !== undefined) {
      const otherNames = Object.values(state.dataroomsById).map((d) => d.name);
      if (isNameTaken(name, otherNames, current.name)) {
        throw new NameConflictError(name, "among your datarooms");
      }
    }

    const updated: Dataroom = {
      ...current,
      ...patch,
      name,
      description: patch.description?.trim() ?? current.description,
      updatedAt: now(),
    };
    await DataroomRepository.put(updated);
    set((s) => ({ dataroomsById: { ...s.dataroomsById, [dataroomId]: updated } }));

    if (patch.name && patch.name.trim() !== current.name) {
      await get().logActivity({
        type: "dataroom.rename",
        targetId: dataroomId,
        targetName: name,
        detail: `was "${current.name}"`,
      });
    }
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
          tagsById: {},
          tagIds: [],
          sharesById: {},
          shareIds: [],
          activity: [],
          checklistById: {},
          checklistIds: [],
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
      starred: false,
      deletedAt: null,
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
    await get().logActivity({
      type: "folder.create",
      targetId: folder.id,
      targetName: folder.name,
    });
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
    await get().logActivity({
      type: "folder.rename",
      targetId: folderId,
      targetName: trimmed,
      detail: `was "${folder.name}"`,
    });
  },

  async moveFolder(folderId, newParentId) {
    const state = get();
    const folder = state.foldersById[folderId];
    if (!folder || folder.parentId === newParentId || folderId === newParentId) {
      return;
    }
    if (newParentId && ancestorsOf(state.foldersById, newParentId).includes(folderId)) {
      throw new Error("Cannot move a folder into itself");
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
    await get().logActivity({
      type: "folder.move",
      targetId: folderId,
      targetName: folder.name,
      detail: `into ${state.foldersById[newParentId ?? ""]?.name ?? "the root"}`,
    });
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
      // Uploads auto-suffix rather than fail, so one collision in a 10-file drop
      // does not throw away the other nine.
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
        starred: false,
        deletedAt: null,
        tagIds: [],
        note: "",
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
      await get().logActivity(
        uploaded.map((item) => ({
          type: "file.upload" as const,
          targetId: item.id,
          targetName: item.name,
        })),
      );
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
    await get().logActivity({
      type: "file.rename",
      targetId: fileId,
      targetName: trimmed,
      detail: `was "${file.name}"`,
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
    await get().logActivity({
      type: "file.move",
      targetId: fileId,
      targetName: name,
      detail: `into ${state.foldersById[newParentId ?? ""]?.name ?? "the root"}`,
    });
  },

  async updateFileNote(fileId, note) {
    const file = get().filesById[fileId];
    if (!file) return;
    const updated: FileItem = { ...file, note: note.trim(), updatedAt: now() };
    await FileRepository.put(updated);
    set((s) => ({ filesById: { ...s.filesById, [fileId]: updated } }));
  },

  async toggleStar(kind, id) {
    if (kind === "folder") {
      const folder = get().foldersById[id];
      if (!folder) return;
      const updated: Folder = {
        ...folder,
        starred: !folder.starred,
        updatedAt: now(),
      };
      await FolderRepository.put(updated);
      set((s) => ({ foldersById: { ...s.foldersById, [id]: updated } }));
      return;
    }
    const file = get().filesById[id];
    if (!file) return;
    const updated: FileItem = { ...file, starred: !file.starred, updatedAt: now() };
    await FileRepository.put(updated);
    set((s) => ({ filesById: { ...s.filesById, [id]: updated } }));
    await get().logActivity({
      type: "file.star",
      targetId: id,
      targetName: file.name,
      detail: updated.starred ? "starred" : "unstarred",
    });
  },
});
