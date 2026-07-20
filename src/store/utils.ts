import type { FileItem, Folder } from "@/types";
import type { ChildIds, DataState } from "@/store/types";

export const ROOT_PARENT_KEY = "__root__";

export const parentKey = (parentId: string | null) =>
  parentId ?? ROOT_PARENT_KEY;

export const now = () => new Date().toISOString();

export const emptyChildren = (): ChildIds => ({ folderIds: [], fileIds: [] });

export class NameConflictError extends Error {
  constructor(name: string, scope = "in this folder") {
    super(`"${name}" already exists ${scope}`);
    this.name = "NameConflictError";
  }
}

export function buildChildrenIndex(
  folders: Folder[],
  files: FileItem[],
): Record<string, ChildIds> {
  const index: Record<string, ChildIds> = {};
  const bucket = (key: string) => (index[key] ??= emptyChildren());
  for (const folder of folders) bucket(parentKey(folder.parentId)).folderIds.push(folder.id);
  for (const file of files) bucket(parentKey(file.parentId)).fileIds.push(file.id);
  return index;
}

export function addChild(
  index: Record<string, ChildIds>,
  parent: string,
  kind: keyof ChildIds,
  id: string,
): Record<string, ChildIds> {
  const current = index[parent] ?? emptyChildren();
  return {
    ...index,
    [parent]: { ...current, [kind]: [...current[kind], id] },
  };
}

export function removeChild(
  index: Record<string, ChildIds>,
  parent: string,
  kind: keyof ChildIds,
  id: string,
): Record<string, ChildIds> {
  const current = index[parent];
  if (!current) return index;
  return {
    ...index,
    [parent]: { ...current, [kind]: current[kind].filter((c) => c !== id) },
  };
}

export function siblingNames(
  state: Pick<DataState, "foldersById" | "filesById" | "childrenByParent">,
  parentId: string | null,
): string[] {
  const children = state.childrenByParent[parentKey(parentId)];
  if (!children) return [];
  return [
    ...children.folderIds.map((id) => state.foldersById[id]?.name ?? ""),
    ...children.fileIds.map((id) => state.filesById[id]?.name ?? ""),
  ];
}
