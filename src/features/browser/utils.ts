import type { BrowseScope, SortField } from "@/types";
import type { BrowserItem } from "@/features/browser/types";

export const itemId = (item: BrowserItem) =>
  item.kind === "folder" ? item.folder.id : item.file.id;

export const itemName = (item: BrowserItem) =>
  item.kind === "folder" ? item.folder.name : item.file.name;

export const SORT_LABELS: Record<SortField, string> = {
  name: "Name",
  uploadedAt: "Date",
  size: "Size",
};

export const SCOPE_COPY: Record<
  BrowseScope,
  { title: string; empty: string; description: string }
> = {
  folder: {
    title: "Files",
    empty: "This folder is empty",
    description: "Drop PDFs anywhere on the page, or create a folder to organize them.",
  },
  starred: {
    title: "Starred",
    empty: "Nothing starred yet",
    description: "Star the documents you keep coming back to and they will collect here.",
  },
  recent: {
    title: "Recent",
    empty: "No documents yet",
    description: "The most recently uploaded documents in this dataroom appear here.",
  },
  trash: {
    title: "Trash",
    empty: "Trash is empty",
    description: "Deleted folders and files rest here until you empty the trash.",
  },
};

/** Routes are scope-first so a starred view survives a refresh and a back press. */
export function scopePath(dataroomId: string, scope: BrowseScope, folderId?: string | null) {
  if (scope === "folder") {
    return folderId ? `/d/${dataroomId}/f/${folderId}` : `/d/${dataroomId}`;
  }
  return `/d/${dataroomId}/${scope}`;
}

/**
 * Resolves a shift-click into the full span between the anchor and the target,
 * using the order the items are currently rendered in.
 */
export function rangeBetween(
  orderedIds: string[],
  anchorId: string | null,
  targetId: string,
): string[] {
  if (!anchorId) return [targetId];
  const from = orderedIds.indexOf(anchorId);
  const to = orderedIds.indexOf(targetId);
  if (from === -1 || to === -1) return [targetId];
  const [start, end] = from < to ? [from, to] : [to, from];
  return orderedIds.slice(start, end + 1);
}
