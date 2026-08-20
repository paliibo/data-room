import type { ActivityEvent, ActivityType } from "@/types";
import { FILTER_TYPES, type ActivityFilter } from "@/features/activity/types";

/** Verb shown in the feed; the target name is rendered separately. */
export const ACTIVITY_VERBS: Record<ActivityType, string> = {
  "dataroom.create": "created the dataroom",
  "dataroom.rename": "renamed the dataroom",
  "folder.create": "created folder",
  "folder.rename": "renamed folder",
  "folder.move": "moved folder",
  "folder.trash": "moved folder to trash",
  "folder.restore": "restored folder",
  "file.upload": "uploaded",
  "file.rename": "renamed",
  "file.move": "moved",
  "file.trash": "moved to trash",
  "file.restore": "restored",
  "file.delete": "permanently deleted",
  "file.view": "previewed",
  "file.download": "downloaded",
  "file.tag": "updated tags on",
  "file.star": "changed the star on",
  "share.create": "created share link",
  "share.revoke": "revoked share link",
  "share.view": "opened",
  "checklist.create": "added request",
  "checklist.status": "updated request",
};

export function filterEvents(
  events: ActivityEvent[],
  filter: ActivityFilter,
): ActivityEvent[] {
  const allowed = FILTER_TYPES[filter];
  if (!allowed) return events;
  const set = new Set(allowed);
  return events.filter((event) => set.has(event.type));
}

/** Groups a chronological feed under Today / Yesterday / a date. */
export function groupByDay(events: ActivityEvent[]): { label: string; events: ActivityEvent[] }[] {
  const groups: { label: string; events: ActivityEvent[] }[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  for (const event of events) {
    const day = event.at.slice(0, 10);
    const label =
      day === today
        ? "Today"
        : day === yesterday
          ? "Yesterday"
          : new Date(event.at).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
    const last = groups[groups.length - 1];
    if (last?.label === label) last.events.push(event);
    else groups.push({ label, events: [event] });
  }
  return groups;
}
