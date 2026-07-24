import type { FileItem, Folder } from "@/types";
import type { ChildIds, DataState } from "@/store/types";

export const ROOT_PARENT_KEY = "__root__";

export const parentKey = (parentId: string | null) => parentId ?? ROOT_PARENT_KEY;

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
  return { ...index, [parent]: { ...current, [kind]: [...current[kind], id] } };
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

type TreeSlice = Pick<DataState, "foldersById" | "filesById" | "childrenByParent">;

/**
 * Names that a new sibling would collide with. Trashed items are excluded so a
 * deleted "Financials" never blocks you from creating a fresh one.
 */
export function siblingNames(state: TreeSlice, parentId: string | null): string[] {
  const children = state.childrenByParent[parentKey(parentId)];
  if (!children) return [];
  return [
    ...children.folderIds
      .map((id) => state.foldersById[id])
      .filter((f) => f && !f.deletedAt)
      .map((f) => f!.name),
    ...children.fileIds
      .map((id) => state.filesById[id])
      .filter((f) => f && !f.deletedAt)
      .map((f) => f!.name),
  ];
}

/** Every folder and file at or beneath `folderId`, including the folder itself. */
export function collectSubtree(
  state: TreeSlice,
  folderId: string,
): { folders: Folder[]; files: FileItem[] } {
  const folders: Folder[] = [];
  const files: FileItem[] = [];
  const queue = [folderId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const folder = state.foldersById[id];
    if (!folder) continue;
    folders.push(folder);
    const children = state.childrenByParent[id];
    if (!children) continue;
    queue.push(...children.folderIds);
    for (const fileId of children.fileIds) {
      const file = state.filesById[fileId];
      if (file) files.push(file);
    }
  }
  return { folders, files };
}

/** Walks parent pointers to the root, guarding against corrupt cycles. */
export function ancestorsOf(
  foldersById: Record<string, Folder>,
  folderId: string | null,
): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();
  let cursor = folderId ? foldersById[folderId]?.parentId ?? null : null;
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    chain.push(cursor);
    cursor = foldersById[cursor]?.parentId ?? null;
  }
  return chain;
}

/** True when the item itself is trashed but its parent folder is not. */
export function isTrashRoot(
  state: TreeSlice,
  item: Folder | FileItem,
): boolean {
  if (!item.deletedAt) return false;
  if (!item.parentId) return true;
  return !state.foldersById[item.parentId]?.deletedAt;
}
