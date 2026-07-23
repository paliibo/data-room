import type { Tag } from "@/types";
import { withStorage } from "@/storage/indexedDb";

export const TagRepository = {
  async getByDataroom(dataroomId: string): Promise<Tag[]> {
    return withStorage(
      (db) => db.getAllFromIndex("tags", "by-dataroom", dataroomId),
      "Failed to load tags",
    );
  },

  async put(tag: Tag): Promise<void> {
    await withStorage((db) => db.put("tags", tag), "Failed to save tag");
  },

  async delete(tagId: string): Promise<void> {
    await withStorage((db) => db.delete("tags", tagId), "Failed to delete tag");
  },
};
