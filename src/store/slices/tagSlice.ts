import type { StateCreator } from "zustand";
import type { FileItem, Tag } from "@/types";
import { createId } from "@/lib/utils";
import { isNameTaken } from "@/lib/validation";
import { TagRepository } from "@/storage/repositories/TagRepository";
import { FileRepository } from "@/storage/repositories/FileRepository";
import type { DataState, TagSlice } from "@/store/types";
import { NameConflictError, now } from "@/store/utils";

export const createTagSlice: StateCreator<DataState, [], [], TagSlice> = (
  set,
  get,
) => ({
  tagsById: {},
  tagIds: [],

  async createTag(name, color) {
    const state = get();
    const dataroomId = state.activeDataroomId;
    if (!dataroomId) throw new Error("No dataroom is open");
    const trimmed = name.trim();
    const existing = Object.values(state.tagsById).map((t) => t.name);
    if (isNameTaken(trimmed, existing)) {
      throw new NameConflictError(trimmed, "as a tag");
    }
    const tag: Tag = {
      id: createId(),
      dataroomId,
      name: trimmed,
      color,
      createdAt: now(),
    };
    await TagRepository.put(tag);
    set((s) => ({
      tagsById: { ...s.tagsById, [tag.id]: tag },
      tagIds: [...s.tagIds, tag.id],
    }));
    return tag;
  },

  async renameTag(tagId, name) {
    const state = get();
    const tag = state.tagsById[tagId];
    if (!tag) return;
    const trimmed = name.trim();
    const existing = Object.values(state.tagsById).map((t) => t.name);
    if (isNameTaken(trimmed, existing, tag.name)) {
      throw new NameConflictError(trimmed, "as a tag");
    }
    const updated: Tag = { ...tag, name: trimmed };
    await TagRepository.put(updated);
    set((s) => ({ tagsById: { ...s.tagsById, [tagId]: updated } }));
  },

  /** Removing a tag also strips it from every file that carried it. */
  async deleteTag(tagId) {
    const state = get();
    if (!state.tagsById[tagId]) return;
    const affected = Object.values(state.filesById)
      .filter((file) => file.tagIds.includes(tagId))
      .map((file) => ({
        ...file,
        tagIds: file.tagIds.filter((id) => id !== tagId),
        updatedAt: now(),
      }));

    await Promise.all([TagRepository.delete(tagId), FileRepository.putMany(affected)]);
    set((s) => {
      const { [tagId]: _removed, ...tagsById } = s.tagsById;
      return {
        tagsById,
        tagIds: s.tagIds.filter((id) => id !== tagId),
        filesById: {
          ...s.filesById,
          ...Object.fromEntries(affected.map((f) => [f.id, f])),
        },
      };
    });
  },

  async setFileTags(fileId, tagIds) {
    const state = get();
    const file = state.filesById[fileId];
    if (!file) return;
    // Guard against ids left over from a tag deleted in another tab.
    const valid = tagIds.filter((id) => state.tagsById[id]);
    const updated: FileItem = { ...file, tagIds: valid, updatedAt: now() };
    await FileRepository.put(updated);
    set((s) => ({ filesById: { ...s.filesById, [fileId]: updated } }));

    const names = valid.map((id) => state.tagsById[id]?.name).filter(Boolean);
    await get().logActivity({
      type: "file.tag",
      targetId: fileId,
      targetName: file.name,
      detail: names.length > 0 ? `tagged ${names.join(", ")}` : "tags cleared",
    });
  },
});
