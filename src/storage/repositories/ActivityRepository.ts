import type { ActivityEvent } from "@/types";
import { withStorage } from "@/storage/indexedDb";

/** Newest events are the ones anyone looks at, so the log is capped per room. */
export const MAX_EVENTS_PER_DATAROOM = 500;

export const ActivityRepository = {
  async getByDataroom(dataroomId: string): Promise<ActivityEvent[]> {
    const events = await withStorage(
      (db) => db.getAllFromIndex("activity", "by-dataroom", dataroomId),
      "Failed to load activity",
    );
    return events.sort((a, b) => b.at.localeCompare(a.at));
  },

  async append(events: ActivityEvent[]): Promise<void> {
    if (events.length === 0) return;
    await withStorage(async (db) => {
      const tx = db.transaction("activity", "readwrite");
      await Promise.all(events.map((event) => tx.store.put(event)));
      await tx.done;
    }, "Failed to record activity");
  },

  async deleteByDataroom(dataroomId: string): Promise<void> {
    await withStorage(async (db) => {
      const tx = db.transaction("activity", "readwrite");
      const keys = await tx.store.index("by-dataroom").getAllKeys(dataroomId);
      await Promise.all(keys.map((key) => tx.store.delete(key)));
      await tx.done;
    }, "Failed to clear activity");
  },

  /** Trims the oldest events once a room's log exceeds the cap. */
  async prune(dataroomId: string): Promise<void> {
    await withStorage(async (db) => {
      const tx = db.transaction("activity", "readwrite");
      const events = await tx.store.index("by-dataroom").getAll(dataroomId);
      if (events.length <= MAX_EVENTS_PER_DATAROOM) {
        await tx.done;
        return;
      }
      const stale = events
        .sort((a, b) => a.at.localeCompare(b.at))
        .slice(0, events.length - MAX_EVENTS_PER_DATAROOM);
      await Promise.all(stale.map((event) => tx.store.delete(event.id)));
      await tx.done;
    }, "Failed to prune activity");
  },
};
