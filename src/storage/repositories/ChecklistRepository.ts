import type { ChecklistItem } from "@/types";
import { withStorage } from "@/storage/indexedDb";

export const ChecklistRepository = {
  async getByDataroom(dataroomId: string): Promise<ChecklistItem[]> {
    return withStorage(
      (db) => db.getAllFromIndex("checklist", "by-dataroom", dataroomId),
      "Failed to load the checklist",
    );
  },

  async put(item: ChecklistItem): Promise<void> {
    await withStorage(
      (db) => db.put("checklist", item),
      "Failed to save checklist item",
    );
  },

  async putMany(items: ChecklistItem[]): Promise<void> {
    if (items.length === 0) return;
    await withStorage(async (db) => {
      const tx = db.transaction("checklist", "readwrite");
      await Promise.all(items.map((item) => tx.store.put(item)));
      await tx.done;
    }, "Failed to save checklist items");
  },

  async delete(itemId: string): Promise<void> {
    await withStorage(
      (db) => db.delete("checklist", itemId),
      "Failed to delete checklist item",
    );
  },
};
