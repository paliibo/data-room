import { useEffect } from "react";
import type { ShortcutMap } from "@/hooks/types";
import { isTypingTarget, shortcutKey } from "@/hooks/utils";

/**
 * Global shortcut dispatcher. Keys are normalized to a `mod+k` style string so
 * a map entry reads the way the hint in the UI does. Plain keys are ignored
 * while the user is typing; modifier combos still fire.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = shortcutKey(event);
      const handler = shortcuts[key];
      if (!handler) return;
      const usesModifier = key.startsWith("mod+") || key.startsWith("shift+");
      if (!usesModifier && isTypingTarget(event.target)) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts, enabled]);
}
