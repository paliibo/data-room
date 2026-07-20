import type { FileItem, Folder, SortDirection, SortField } from "@/types";
import type { Theme } from "@/hooks/types";

export function compareItems(
  a: Folder | FileItem,
  b: Folder | FileItem,
  field: SortField,
  direction: SortDirection,
): number {
  let result: number;
  switch (field) {
    case "name":
      result = a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      break;
    case "size": {
      const sizeA = "size" in a ? a.size : 0;
      const sizeB = "size" in b ? b.size : 0;
      result = sizeA - sizeB;
      break;
    }
    case "uploadedAt": {
      const dateA = "uploadedAt" in a ? a.uploadedAt : a.createdAt;
      const dateB = "uploadedAt" in b ? b.uploadedAt : b.createdAt;
      result = dateA.localeCompare(dateB);
      break;
    }
  }
  return direction === "asc" ? result : -result;
}

export function compareByName(a: Folder, b: Folder): number {
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const systemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export function storedTheme(): Theme | null {
  try {
    const raw = localStorage.getItem("dataroom-theme");
    const theme: unknown = raw ? JSON.parse(raw)?.state?.theme : null;
    return theme === "dark" || theme === "light" ? theme : null;
  } catch {
    return null;
  }
}
