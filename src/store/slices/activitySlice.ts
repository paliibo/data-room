import type { StateCreator } from "zustand";
import type { ActivityEvent } from "@/types";
import { createId } from "@/lib/utils";
import { ActivityRepository } from "@/storage/repositories/ActivityRepository";
import type { ActivitySlice, DataState } from "@/store/types";
import { now } from "@/store/utils";

/**
 * The audit trail. Every mutating action funnels through `logActivity`, which is
 * what makes the analytics dashboard possible without a second bookkeeping path.
 */
export const createActivitySlice: StateCreator<DataState, [], [], ActivitySlice> = (
  set,
  get,
) => ({
  activity: [],

  async logActivity(draft) {
    const dataroomId = get().activeDataroomId;
    if (!dataroomId) return;
    const drafts = Array.isArray(draft) ? draft : [draft];
    if (drafts.length === 0) return;

    const timestamp = now();
    const events: ActivityEvent[] = drafts.map((d, index) => ({
      id: createId(),
      dataroomId,
      type: d.type,
      actor: d.actor ?? "You",
      targetId: d.targetId ?? null,
      targetName: d.targetName,
      detail: d.detail ?? "",
      // Nudge each event so a batched upload keeps a stable, readable order.
      at: d.at ?? new Date(Date.parse(timestamp) + index).toISOString(),
    }));

    // The feed's invariant is newest-first. Merging by timestamp rather than
    // prepending keeps that true even for backdated batches.
    set((s) => ({
      activity: [...events, ...s.activity].sort((a, b) => b.at.localeCompare(a.at)),
    }));
    await ActivityRepository.append(events);
    await ActivityRepository.prune(dataroomId);
  },

  async clearActivity() {
    const dataroomId = get().activeDataroomId;
    if (!dataroomId) return;
    await ActivityRepository.deleteByDataroom(dataroomId);
    if (get().activeDataroomId === dataroomId) set({ activity: [] });
  },
});
