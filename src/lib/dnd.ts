export const DND_MIME = "application/x-dataroom-item";

export interface DragPayload {
  kind: "folder" | "file";
  id: string;
}

export function setDragPayload(event: React.DragEvent, payload: DragPayload) {
  event.dataTransfer.setData(DND_MIME, JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "move";
}

export function getDragPayload(event: React.DragEvent): DragPayload | null {
  const raw = event.dataTransfer.getData(DND_MIME);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "kind" in parsed &&
      "id" in parsed &&
      (parsed.kind === "folder" || parsed.kind === "file") &&
      typeof parsed.id === "string"
    ) {
      return parsed as DragPayload;
    }
  } catch {
    return null;
  }
  return null;
}

export function isItemDrag(event: React.DragEvent): boolean {
  return event.dataTransfer.types.includes(DND_MIME);
}

export function isFileDrag(event: React.DragEvent): boolean {
  return event.dataTransfer.types.includes("Files");
}
