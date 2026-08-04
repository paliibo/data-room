import { cn } from "@/lib/utils";
import type { ProgressRingProps } from "@/components/charts/types";

/**
 * One number, drawn. A ring rather than a bar because it sits beside a status
 * breakdown and should read as a summary, not as another series.
 */
export function ProgressRing({ percent, label, sublabel, size = 132 }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          role="img"
          aria-label={`${label}: ${clamped}% complete`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--success)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-semibold tabular")}>{clamped}%</span>
          {sublabel && (
            <span className="text-xs text-muted-foreground">{sublabel}</span>
          )}
        </div>
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
