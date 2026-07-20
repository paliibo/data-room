import type { SortField } from "@/types";
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
