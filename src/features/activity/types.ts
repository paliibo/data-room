import type { ActivityEvent, ActivityType } from "@/types";

export type ActivityFilter = "all" | "documents" | "sharing" | "structure";

export interface ActivityFeedProps {
  events: ActivityEvent[];
  filter: ActivityFilter;
  emptyMessage?: string;
  /** Caps the list; the activity page passes Infinity. */
  limit?: number;
}

export interface ActivityRowProps {
  event: ActivityEvent;
  /** Suppresses the connector line under the final row. */
  isLast: boolean;
}

/** Which event types each filter admits, so the tab labels mean something. */
export const FILTER_TYPES: Record<ActivityFilter, ActivityType[] | null> = {
  all: null,
  documents: [
    "file.upload",
    "file.rename",
    "file.view",
    "file.download",
    "file.tag",
    "file.star",
    "file.trash",
    "file.restore",
    "file.delete",
  ],
  sharing: ["share.create", "share.revoke", "share.view"],
  structure: [
    "folder.create",
    "folder.rename",
    "folder.move",
    "folder.trash",
    "folder.restore",
    "file.move",
    "dataroom.create",
    "dataroom.rename",
    "checklist.create",
    "checklist.status",
  ],
};
