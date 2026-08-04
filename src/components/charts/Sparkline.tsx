import { useId } from "react";
import { cn } from "@/lib/utils";
import type { SparklineProps } from "@/components/charts/types";

const WIDTH = 120;
const HEIGHT = 32;

/**
 * A single unlabelled series next to the number it belongs to. No legend and no
 * axis: the stat tile's own title names the measure, and the shape is there for
 * trend, not for reading values off.
 */
export function Sparkline({ values, label, className }: SparklineProps) {
  const gradientId = useId();
  if (values.length < 2) return null;

  const max = Math.max(...values, 1);
  const step = WIDTH / (values.length - 1);
  const points = values.map((value, index) => ({
    x: index * step,
    y: HEIGHT - 2 - (value / max) * (HEIGHT - 6),
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={cn("h-8 w-full overflow-visible", className)}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* A 2px surface ring keeps the end marker legible over the area fill. */}
      <circle
        cx={last.x}
        cy={last.y}
        r="3"
        fill="var(--chart-1)"
        stroke="var(--card)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
