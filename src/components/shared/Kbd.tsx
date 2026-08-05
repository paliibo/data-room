import { cn } from "@/lib/utils";
import type { KbdProps } from "@/components/shared/types";

const SYMBOLS: Record<string, string> = {
  mod: navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl",
  shift: "⇧",
  enter: "↵",
  esc: "Esc",
  delete: "⌦",
};

/** Renders "mod+k" as ⌘ K — one source for every shortcut hint in the app. */
export function Kbd({ keys, className }: KbdProps) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.split("+").map((key) => (
        <kbd key={key} className="kbd">
          {SYMBOLS[key] ?? key.toUpperCase()}
        </kbd>
      ))}
    </span>
  );
}
