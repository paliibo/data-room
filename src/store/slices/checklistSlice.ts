import type { StateCreator } from "zustand";
import type { ChecklistItem } from "@/types";
import { createId } from "@/lib/utils";
import { ChecklistRepository } from "@/storage/repositories/ChecklistRepository";
import type { ChecklistSlice, DataState } from "@/store/types";
import { now } from "@/store/utils";

/**
 * The due-diligence request list: what the other side asked for, and which
 * uploaded documents answer it.
 */
export const createChecklistSlice: StateCreator<DataState, [], [], ChecklistSlice> = (
  set,
  get,
) => ({
  checklistById: {},
  checklistIds: [],

  async createChecklistItem(title, category) {
    const dataroomId = get().activeDataroomId;
    if (!dataroomId) throw new Error("No dataroom is open");
    const item: ChecklistItem = {
      id: createId(),
      dataroomId,
      title: title.trim(),
      category: category.trim() || "General",
      status: "requested",
      fileIds: [],
      createdAt: now(),
      updatedAt: now(),
    };
    await ChecklistRepository.put(item);
    set((s) => ({
      checklistById: { ...s.checklistById, [item.id]: item },
      checklistIds: [...s.checklistIds, item.id],
    }));
    await get().logActivity({
      type: "checklist.create",
      targetId: item.id,
      targetName: item.title,
    });
    return item;
  },

  async updateChecklistItem(itemId, patch) {
    const item = get().checklistById[itemId];
    if (!item) return;
    const updated: ChecklistItem = {
      ...item,
      ...patch,
      title: patch.title?.trim() ?? item.title,
      updatedAt: now(),
    };
    await ChecklistRepository.put(updated);
    set((s) => ({ checklistById: { ...s.checklistById, [itemId]: updated } }));

    if (patch.status && patch.status !== item.status) {
      await get().logActivity({
        type: "checklist.status",
        targetId: itemId,
        targetName: item.title,
        detail: `marked ${patch.status.replace("-", " ")}`,
      });
    }
  },

  async deleteChecklistItem(itemId) {
    if (!get().checklistById[itemId]) return;
    await ChecklistRepository.delete(itemId);
    set((s) => {
      const { [itemId]: _removed, ...checklistById } = s.checklistById;
      return {
        checklistById,
        checklistIds: s.checklistIds.filter((id) => id !== itemId),
      };
    });
  },

  /** Bulk-adds a starter request list; skips titles that already exist. */
  async seedChecklist(entries) {
    const dataroomId = get().activeDataroomId;
    if (!dataroomId) throw new Error("No dataroom is open");
    const existing = new Set(
      Object.values(get().checklistById).map((c) => c.title.toLocaleLowerCase()),
    );
    const timestamp = now();
    const items: ChecklistItem[] = entries
      .filter((entry) => !existing.has(entry.title.toLocaleLowerCase()))
      .map((entry, index) => ({
        id: createId(),
        dataroomId,
        title: entry.title,
        category: entry.category,
        status: "requested" as const,
        fileIds: [],
        createdAt: new Date(Date.parse(timestamp) + index).toISOString(),
        updatedAt: timestamp,
      }));
    if (items.length === 0) return;

    await ChecklistRepository.putMany(items);
    set((s) => ({
      checklistById: {
        ...s.checklistById,
        ...Object.fromEntries(items.map((i) => [i.id, i])),
      },
      checklistIds: [...s.checklistIds, ...items.map((i) => i.id)],
    }));
  },
});
