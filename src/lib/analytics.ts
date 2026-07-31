import type { ActivityEvent, FileItem } from "@/types";
import type { AnalyticsSummary, DayBucket, FileEngagement } from "@/hooks/types";

const DAY_MS = 86_400_000;

const dayKey = (iso: string) => iso.slice(0, 10);

/**
 * Aggregation over the audit log. Pure and synchronous: the activity array is
 * already in memory, and keeping this outside React makes it straightforward to
 * test the bucketing rules directly.
 */
export function summarize(
  events: ActivityEvent[],
  filesById: Record<string, FileItem>,
  days = 14,
  today: Date = new Date(),
): AnalyticsSummary {
  const timeline = buildTimeline(events, days, today);

  const engagement = new Map<string, FileEngagement>();
  const viewers = new Set<string>();
  let totalViews = 0;
  let totalDownloads = 0;
  let totalUploads = 0;

  for (const event of events) {
    if (event.type === "file.upload") totalUploads++;
    if (event.type === "share.view") viewers.add(event.actor);
    if (event.type !== "file.view" && event.type !== "file.download") continue;

    if (event.type === "file.view") totalViews++;
    else totalDownloads++;

    if (!event.targetId) continue;
    const current = engagement.get(event.targetId) ?? {
      fileId: event.targetId,
      name: filesById[event.targetId]?.name ?? event.targetName,
      views: 0,
      downloads: 0,
      lastViewedAt: null,
    };
    if (event.type === "file.view") {
      current.views++;
      if (!current.lastViewedAt || event.at > current.lastViewedAt) {
        current.lastViewedAt = event.at;
      }
    } else {
      current.downloads++;
    }
    engagement.set(event.targetId, current);
  }

  const topFiles = [...engagement.values()]
    .sort((a, b) => b.views + b.downloads - (a.views + a.downloads))
    .slice(0, 6);

  const busiestDay = timeline.reduce<DayBucket | null>((best, bucket) => {
    const total = bucket.views + bucket.downloads + bucket.uploads;
    if (total === 0) return best;
    const bestTotal = best ? best.views + best.downloads + best.uploads : -1;
    return total > bestTotal ? bucket : best;
  }, null);

  return {
    totalViews,
    totalDownloads,
    totalUploads,
    uniqueViewers: viewers.size,
    timeline,
    topFiles,
    busiestDay,
    recentEvents: events.slice(0, 8),
  };
}

/** A dense day-by-day series — empty days included, so the chart has no gaps. */
export function buildTimeline(
  events: ActivityEvent[],
  days: number,
  today: Date = new Date(),
): DayBucket[] {
  const buckets = new Map<string, DayBucket>();
  const start = new Date(today.getTime() - (days - 1) * DAY_MS);

  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      views: 0,
      downloads: 0,
      uploads: 0,
    });
  }

  for (const event of events) {
    const bucket = buckets.get(dayKey(event.at));
    if (!bucket) continue;
    if (event.type === "file.view" || event.type === "share.view") bucket.views++;
    else if (event.type === "file.download") bucket.downloads++;
    else if (event.type === "file.upload") bucket.uploads++;
  }

  return [...buckets.values()];
}

/** Scales a series to a 0..1 range for sparkline and bar rendering. */
export function normalizeSeries(values: number[]): number[] {
  const max = Math.max(...values, 0);
  if (max === 0) return values.map(() => 0);
  return values.map((value) => value / max);
}
