import { cn } from "@/lib/utils";
import type { RankedBarsProps } from "@/components/charts/types";

/**
 * Magnitude for one measure across named things — so it is a single hue, sorted
 * descending, with the value written next to every bar. Horizontal because the
 * labels are file names and would never fit under vertical columns.
 */
export function RankedBars({ items, valueLabel, emptyMessage, onSelect }: RankedBarsProps) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ol className="flex flex-col gap-2.5">
      {items.map((item, index) => {
        const Row = onSelect ? "button" : "div";
        return (
          <li key={item.id}>
            <Row
              {...(onSelect
                ? { type: "button" as const, onClick: () => onSelect(item.id) }
                : {})}
              className={cn(
                "flex w-full flex-col gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                onSelect && "cursor-pointer hover:bg-accent",
              )}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="w-4 shrink-0 text-xs text-muted-foreground tabular">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm font-medium" title={item.label}>
                    {item.label}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular">
                  {item.value} {valueLabel}
                  {item.secondary ? ` · ${item.secondary}` : ""}
                </span>
              </span>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                <span
                  className="block h-full rounded-full bg-chart-1 transition-[width] duration-500"
                  style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }}
                />
              </span>
            </Row>
          </li>
        );
      })}
    </ol>
  );
}
