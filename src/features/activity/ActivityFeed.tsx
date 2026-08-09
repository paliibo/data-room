import { Fragment } from "react";
import {
  Download,
  Eye,
  FilePlus2,
  FolderPlus,
  History,
  Link2,
  ListChecks,
  Pencil,
  RotateCcw,
  Star,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatRelative } from "@/lib/format";
import { ACTIVITY_VERBS, filterEvents, groupByDay } from "@/features/activity/utils";
import type { ActivityFeedProps, ActivityRowProps } from "@/features/activity/types";
import type { ActivityType } from "@/types";

const ICONS: Partial<Record<ActivityType, typeof Eye>> = {
  "file.upload": FilePlus2,
  "file.view": Eye,
  "file.download": Download,
  "file.tag": TagIcon,
  "file.star": Star,
  "file.trash": Trash2,
  "file.delete": Trash2,
  "file.restore": RotateCcw,
  "folder.create": FolderPlus,
  "folder.trash": Trash2,
  "folder.restore": RotateCcw,
  "share.create": Link2,
  "share.revoke": Link2,
  "share.view": Eye,
  "checklist.create": ListChecks,
  "checklist.status": ListChecks,
};

/** Destructive events get a red dot; sharing gets brand. Everything else is quiet. */
function toneFor(type: ActivityType) {
  if (type.endsWith(".trash") || type === "file.delete") return "text-destructive bg-destructive/10";
  if (type.startsWith("share.")) return "text-brand bg-brand-soft";
  if (type === "file.upload" || type.endsWith(".restore")) return "text-success bg-success/10";
  return "text-muted-foreground bg-muted";
}

function ActivityRow({ event, isLast }: ActivityRowProps) {
  const Icon = ICONS[event.type] ?? Pencil;

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast && (
        <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border" aria-hidden />
      )}
      <span
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
          toneFor(event.type),
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-sm leading-snug">
          <span className="font-medium">{event.actor}</span>{" "}
          <span className="text-muted-foreground">{ACTIVITY_VERBS[event.type]}</span>{" "}
          <span className="font-medium">{event.targetName}</span>
          {event.detail && (
            <span className="text-muted-foreground"> — {event.detail}</span>
          )}
        </p>
        <time
          dateTime={event.at}
          className="text-xs text-muted-foreground"
          title={new Date(event.at).toLocaleString()}
        >
          {formatRelative(event.at)}
        </time>
      </div>
    </li>
  );
}

export function ActivityFeed({
  events,
  filter,
  emptyMessage = "Nothing has happened in this dataroom yet.",
  limit = 50,
}: ActivityFeedProps) {
  const filtered = filterEvents(events, filter).slice(0, limit);

  if (filtered.length === 0) {
    return (
      <EmptyState
        compact
        icon={History}
        title="No activity"
        description={emptyMessage}
      />
    );
  }

  const groups = groupByDay(filtered);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <Fragment key={group.label}>
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </h3>
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>
          <ol className="flex flex-col">
            {group.events.map((event, index) => (
              <ActivityRow
                key={event.id}
                event={event}
                isLast={index === group.events.length - 1}
              />
            ))}
          </ol>
        </Fragment>
      ))}
    </div>
  );
}
