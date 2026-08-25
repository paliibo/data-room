import { describe, expect, it } from "vitest";
import { ACTIVITY_VERBS, filterEvents, groupByDay } from "@/features/activity/utils";
import type { ActivityEvent, ActivityType } from "@/types";

let seq = 0;
const event = (type: ActivityType, at: string): ActivityEvent => ({
  id: `e${++seq}`,
  dataroomId: "room-1",
  type,
  actor: "You",
  targetId: null,
  targetName: "Thing",
  detail: "",
  at,
});

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() - offsetDays * DAY).toISOString();

describe("ACTIVITY_VERBS", () => {
  it("has a phrase for every activity type", () => {
    // A missing verb would render an empty gap in the feed.
    const types: ActivityType[] = [
      "dataroom.create", "dataroom.rename", "folder.create", "folder.rename",
      "folder.move", "folder.trash", "folder.restore", "file.upload", "file.rename",
      "file.move", "file.trash", "file.restore", "file.delete", "file.view",
      "file.download", "file.tag", "file.star", "share.create", "share.revoke",
      "share.view", "checklist.create", "checklist.status",
    ];
    for (const type of types) expect(ACTIVITY_VERBS[type]).toBeTruthy();
  });
});

describe("filterEvents", () => {
  const events = [
    event("file.upload", iso(0)),
    event("share.create", iso(0)),
    event("folder.create", iso(0)),
  ];

  it("passes everything through on 'all'", () => {
    expect(filterEvents(events, "all")).toHaveLength(3);
  });

  it("narrows to document events", () => {
    expect(filterEvents(events, "documents").map((e) => e.type)).toEqual(["file.upload"]);
  });

  it("narrows to sharing events", () => {
    expect(filterEvents(events, "sharing").map((e) => e.type)).toEqual(["share.create"]);
  });

  it("narrows to structural events", () => {
    expect(filterEvents(events, "structure").map((e) => e.type)).toEqual(["folder.create"]);
  });
});

describe("groupByDay", () => {
  it("labels the current and previous day in words", () => {
    const groups = groupByDay([event("file.view", iso(0)), event("file.view", iso(1))]);
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday"]);
  });

  it("keeps same-day events in one group", () => {
    const groups = groupByDay([event("file.view", iso(0)), event("file.download", iso(0))]);
    expect(groups).toHaveLength(1);
    expect(groups[0].events).toHaveLength(2);
  });

  it("falls back to a full date further back", () => {
    const groups = groupByDay([event("file.view", iso(10))]);
    expect(groups[0].label).not.toMatch(/Today|Yesterday/);
  });

  it("returns nothing for an empty feed", () => {
    expect(groupByDay([])).toEqual([]);
  });
});
