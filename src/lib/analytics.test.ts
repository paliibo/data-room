import { describe, expect, it } from "vitest";
import { buildTimeline, normalizeSeries, summarize } from "@/lib/analytics";
import { makeFile } from "@/test/factories";
import type { ActivityEvent, ActivityType } from "@/types";

const TODAY = new Date("2026-01-15T12:00:00.000Z");

let seq = 0;
function event(type: ActivityType, at: string, overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id: `event-${++seq}`,
    dataroomId: "room-1",
    type,
    actor: "You",
    targetId: null,
    targetName: "Document.pdf",
    detail: "",
    at,
    ...overrides,
  };
}

describe("buildTimeline", () => {
  it("emits one dense bucket per day, oldest first", () => {
    const timeline = buildTimeline([], 5, TODAY);
    expect(timeline).toHaveLength(5);
    expect(timeline[0].date).toBe("2026-01-11");
    expect(timeline[4].date).toBe("2026-01-15");
  });

  it("keeps quiet days as zeros rather than dropping them", () => {
    const timeline = buildTimeline([event("file.view", "2026-01-15T09:00:00.000Z")], 3, TODAY);
    expect(timeline.map((b) => b.views)).toEqual([0, 0, 1]);
  });

  it("counts each event type into its own series", () => {
    const at = "2026-01-15T09:00:00.000Z";
    const timeline = buildTimeline(
      [
        event("file.view", at),
        event("share.view", at),
        event("file.download", at),
        event("file.upload", at),
      ],
      1,
      TODAY,
    );
    // A share view is a view of the room, so it lands in the same series.
    expect(timeline[0]).toMatchObject({ views: 2, downloads: 1, uploads: 1 });
  });

  it("ignores events older than the window", () => {
    const timeline = buildTimeline([event("file.view", "2025-12-01T09:00:00.000Z")], 7, TODAY);
    expect(timeline.every((b) => b.views === 0)).toBe(true);
  });
});

describe("summarize", () => {
  const filesById = { "file-1": makeFile({ id: "file-1", name: "Cap table.pdf" }) };

  it("totals views, downloads and uploads", () => {
    const summary = summarize(
      [
        event("file.view", "2026-01-15T09:00:00.000Z", { targetId: "file-1" }),
        event("file.view", "2026-01-14T09:00:00.000Z", { targetId: "file-1" }),
        event("file.download", "2026-01-14T09:05:00.000Z", { targetId: "file-1" }),
        event("file.upload", "2026-01-10T09:00:00.000Z", { targetId: "file-1" }),
      ],
      filesById,
      14,
      TODAY,
    );
    expect(summary).toMatchObject({ totalViews: 2, totalDownloads: 1, totalUploads: 1 });
  });

  it("counts distinct share visitors, not share views", () => {
    const summary = summarize(
      [
        event("share.view", "2026-01-15T09:00:00.000Z", { actor: "Counsel" }),
        event("share.view", "2026-01-15T10:00:00.000Z", { actor: "Counsel" }),
        event("share.view", "2026-01-15T11:00:00.000Z", { actor: "Northgate" }),
      ],
      filesById,
      14,
      TODAY,
    );
    expect(summary.uniqueViewers).toBe(2);
  });

  it("ranks engagement by views plus downloads and resolves current names", () => {
    const summary = summarize(
      [
        event("file.view", "2026-01-15T09:00:00.000Z", { targetId: "file-1", targetName: "Old name.pdf" }),
        event("file.download", "2026-01-15T09:01:00.000Z", { targetId: "file-1" }),
        event("file.view", "2026-01-15T09:02:00.000Z", { targetId: "file-2", targetName: "Other.pdf" }),
      ],
      filesById,
      14,
      TODAY,
    );
    expect(summary.topFiles[0]).toMatchObject({
      fileId: "file-1",
      // The stored file wins over the name captured at event time.
      name: "Cap table.pdf",
      views: 1,
      downloads: 1,
    });
    expect(summary.topFiles[1].fileId).toBe("file-2");
  });

  it("tracks the most recent view per file", () => {
    const summary = summarize(
      [
        event("file.view", "2026-01-15T09:00:00.000Z", { targetId: "file-1" }),
        event("file.view", "2026-01-13T09:00:00.000Z", { targetId: "file-1" }),
      ],
      filesById,
      14,
      TODAY,
    );
    expect(summary.topFiles[0].lastViewedAt).toBe("2026-01-15T09:00:00.000Z");
  });

  it("reports no busiest day when nothing happened", () => {
    expect(summarize([], filesById, 14, TODAY).busiestDay).toBeNull();
  });

  it("picks the day with the most combined events", () => {
    const summary = summarize(
      [
        event("file.view", "2026-01-14T09:00:00.000Z"),
        event("file.view", "2026-01-14T10:00:00.000Z"),
        event("file.view", "2026-01-15T09:00:00.000Z"),
      ],
      filesById,
      14,
      TODAY,
    );
    expect(summary.busiestDay?.date).toBe("2026-01-14");
  });
});

describe("normalizeSeries", () => {
  it("scales against the maximum", () => {
    expect(normalizeSeries([0, 5, 10])).toEqual([0, 0.5, 1]);
  });

  it("returns zeros rather than dividing by zero", () => {
    expect(normalizeSeries([0, 0])).toEqual([0, 0]);
  });
});
