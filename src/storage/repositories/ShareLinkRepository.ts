import type { ShareLink } from "@/types";
import { withStorage } from "@/storage/indexedDb";

export const ShareLinkRepository = {
  async getByDataroom(dataroomId: string): Promise<ShareLink[]> {
    return withStorage(
      (db) => db.getAllFromIndex("shareLinks", "by-dataroom", dataroomId),
      "Failed to load share links",
    );
  },

  /** Token lookup drives the public `/s/:token` route, which has no room context. */
  async getByToken(token: string): Promise<ShareLink | undefined> {
    return withStorage(
      (db) => db.getFromIndex("shareLinks", "by-token", token),
      "Failed to resolve share link",
    );
  },

  async put(link: ShareLink): Promise<void> {
    await withStorage(
      (db) => db.put("shareLinks", link),
      "Failed to save share link",
    );
  },

  async delete(linkId: string): Promise<void> {
    await withStorage(
      (db) => db.delete("shareLinks", linkId),
      "Failed to delete share link",
    );
  },
};
