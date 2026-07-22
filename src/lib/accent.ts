import type { AccentColor } from "@/types";

export const ACCENTS: AccentColor[] = [
  "indigo",
  "violet",
  "sky",
  "emerald",
  "amber",
  "rose",
];

export const ACCENT_LABELS: Record<AccentColor, string> = {
  indigo: "Indigo",
  violet: "Violet",
  sky: "Sky",
  emerald: "Emerald",
  amber: "Amber",
  rose: "Rose",
};

/**
 * Accents resolve to CSS custom properties defined once in index.css, so a chip,
 * a chart series and a room icon all read from the same theme-aware value.
 */
export function accentVars(accent: AccentColor): React.CSSProperties {
  return {
    "--accent-solid": `var(--accent-${accent})`,
    "--accent-soft": `var(--accent-${accent}-soft)`,
  } as React.CSSProperties;
}

/** Stable accent choice so seeded/imported rooms look intentional, not random. */
export function accentFromSeed(seed: string): AccentColor {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ACCENTS[hash % ACCENTS.length];
}
