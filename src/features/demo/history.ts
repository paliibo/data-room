import { useDataStore } from "@/store/dataStore";
import type { ActivityDraft } from "@/store/types";
import type { FileItem } from "@/types";

const DAY_MS = 86_400_000;

const VIEWERS = [
  "Buy-side counsel — read only",
  "Northgate Capital",
  "You",
] as const;

/**
 * A deterministic pseudo-random sequence. The demo should look the same every
 * time it is generated — a dashboard that reshuffles on each reload is harder to
 * trust than one that does not.
 */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * Backfills two weeks of plausible reading history so the analytics dashboard
 * has something real to aggregate on a first visit. Weekends are quieter and
 * interest ramps up toward the present, the way a live deal actually behaves.
 */
export async function seedDemoHistory(days = 14): Promise<void> {
  const files = Object.values(useDataStore.getState().filesById).filter((f) => !f.deletedAt);
  if (files.length === 0) return;

  const random = makeRandom(0x5eed);
  const drafts: ActivityDraft[] = [];
  const now = Date.now();

  // A few documents carry most of the attention, as in a real room.
  const hot = [...files].sort(() => random() - 0.5).slice(0, 5);
  const pick = (): FileItem =>
    random() < 0.62 ? hot[Math.floor(random() * hot.length)] : files[Math.floor(random() * files.length)];

  for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
    const date = new Date(now - dayOffset * DAY_MS);
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    // Interest ramps toward the present; weekends stay quiet.
    const intensity = (1 - dayOffset / days) * (isWeekend ? 0.25 : 1);
    const views = Math.round(random() * 6 * intensity + intensity * 3);

    for (let i = 0; i < views; i++) {
      const file = pick();
      const at = new Date(
        date.setHours(9 + Math.floor(random() * 9), Math.floor(random() * 60), 0, 0),
      ).toISOString();
      const actor = VIEWERS[Math.floor(random() * VIEWERS.length)];

      drafts.push({ type: "file.view", targetId: file.id, targetName: file.name, actor, at });
      // Roughly a quarter of reads end in a download.
      if (random() < 0.26) {
        drafts.push({
          type: "file.download",
          targetId: file.id,
          targetName: file.name,
          actor,
          at: new Date(Date.parse(at) + 90_000).toISOString(),
        });
      }
      if (random() < 0.12) {
        drafts.push({
          type: "share.view",
          targetName: actor,
          actor,
          detail: "opened the shared link",
          at,
        });
      }
    }
  }

  await useDataStore.getState().logActivity(drafts);
}
