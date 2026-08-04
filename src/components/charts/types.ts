import type { DayBucket } from "@/hooks/types";

/** Series identity is fixed, never cycled: slot 1 is always views, and so on. */
export interface Series {
  key: "views" | "downloads" | "uploads";
  label: string;
  /** CSS variable holding this series' colour for the active theme. */
  color: string;
}

export const ACTIVITY_SERIES: Series[] = [
  { key: "views", label: "Views", color: "var(--chart-1)" },
  { key: "downloads", label: "Downloads", color: "var(--chart-2)" },
  { key: "uploads", label: "Uploads", color: "var(--chart-3)" },
];

export interface ActivityTimelineProps {
  data: DayBucket[];
  className?: string;
}

export interface SparklineProps {
  values: number[];
  /** Accessible summary; the sparkline itself is decorative next to its number. */
  label: string;
  className?: string;
}

export interface RankedBar {
  id: string;
  label: string;
  value: number;
  secondary?: string;
}

export interface RankedBarsProps {
  items: RankedBar[];
  valueLabel: string;
  emptyMessage: string;
  onSelect?: (id: string) => void;
}

export interface ProgressRingProps {
  /** 0–100. */
  percent: number;
  label: string;
  sublabel?: string;
  size?: number;
}
