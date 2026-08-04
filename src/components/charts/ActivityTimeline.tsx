import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { ACTIVITY_SERIES, type ActivityTimelineProps } from "@/components/charts/types";

const HEIGHT = 132;
const GAP = 2; // Surface gap between stacked segments, in px.
const RADIUS = 4;

/**
 * Daily activity, stacked by event type.
 *
 * One axis only, a dense day series so gaps read as quiet days rather than
 * missing data, and identity carried by a legend plus a hover readout — never
 * by colour alone.
 */
export function ActivityTimeline({ data, className }: ActivityTimelineProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const captionId = useId();

  const totals = data.map((d) => d.views + d.downloads + d.uploads);
  const max = Math.max(...totals, 1);
  const active = hovered !== null ? data[hovered] : null;

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {ACTIVITY_SERIES.map((series) => (
            <li key={series.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ background: series.color }}
                aria-hidden
              />
              {series.label}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground tabular" aria-live="polite">
          {active
            ? `${active.label} · ${active.views} views · ${active.downloads} downloads · ${active.uploads} uploads`
            : `Peak ${max} event${max === 1 ? "" : "s"} in a day`}
        </p>
      </div>

      <div
        className="relative flex items-end gap-[3px]"
        style={{ height: HEIGHT }}
        onMouseLeave={() => setHovered(null)}
        role="img"
        aria-describedby={captionId}
      >
        {/* Recessive baseline; no grid lines competing with the marks. */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-chart-grid" aria-hidden />

        {data.map((bucket, index) => {
          const total = totals[index];
          const scale = (value: number) => (value / max) * (HEIGHT - 8);
          const segments = [
            { key: "views", value: bucket.views, color: "var(--chart-1)" },
            { key: "downloads", value: bucket.downloads, color: "var(--chart-2)" },
            { key: "uploads", value: bucket.uploads, color: "var(--chart-3)" },
          ].filter((segment) => segment.value > 0);

          return (
            <button
              key={bucket.date}
              type="button"
              // Hit target spans the full column height, not just the bar.
              className="group relative flex h-full flex-1 cursor-default flex-col justify-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              aria-label={`${bucket.label}: ${bucket.views} views, ${bucket.downloads} downloads, ${bucket.uploads} uploads`}
            >
              <span
                className={cn(
                  "absolute inset-0 rounded-md bg-accent/0 transition-colors",
                  hovered === index && "bg-accent/60",
                )}
                aria-hidden
              />
              {total === 0 ? (
                <span
                  className="relative h-[3px] w-full rounded-full bg-chart-grid"
                  aria-hidden
                />
              ) : (
                <span className="relative flex w-full flex-col-reverse">
                  {segments.map((segment, segmentIndex) => (
                    <span
                      key={segment.key}
                      style={{
                        height: Math.max(3, scale(segment.value)),
                        background: segment.color,
                        marginTop: segmentIndex === 0 ? 0 : GAP,
                        // Only the top of the stack gets rounded ends; the
                        // bottom stays anchored flat to the baseline.
                        borderRadius:
                          segmentIndex === segments.length - 1
                            ? `${RADIUS}px ${RADIUS}px 2px 2px`
                            : "2px",
                      }}
                      aria-hidden
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
      <figcaption id={captionId} className="sr-only">
        Daily document activity over the last {data.length} days, stacked by
        views, downloads and uploads.
      </figcaption>
    </figure>
  );
}
