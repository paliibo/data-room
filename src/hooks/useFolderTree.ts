import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDataStore } from "@/store/dataStore";
import { parentKey } from "@/store/utils";
import { useUiStore } from "@/store/uiStore";
import { compareByName } from "@/hooks/utils";
import type { TreeNode } from "@/types";

export function useFolderTree(): TreeNode[] {
  const { foldersById, childrenByParent } = useDataStore(
    useShallow((s) => ({
      foldersById: s.foldersById,
      childrenByParent: s.childrenByParent,
    })),
  );
  const expandedFolderIds = useUiStore((s) => s.expandedFolderIds);

  return useMemo(() => {
    const nodes: TreeNode[] = [];
    const visit = (parentId: string | null, depth: number) => {
      const childIds = childrenByParent[parentKey(parentId)]?.folderIds ?? [];
      const children = childIds
        .map((id) => foldersById[id])
        .filter(Boolean)
        .sort(compareByName);
      for (const folder of children) {
        const hasChildren =
          (childrenByParent[folder.id]?.folderIds.length ?? 0) > 0;
        const isExpanded = Boolean(expandedFolderIds[folder.id]);
        nodes.push({ folder, depth, hasChildren, isExpanded });
        if (hasChildren && isExpanded) visit(folder.id, depth + 1);
      }
    };
    visit(null, 0);
    return nodes;
  }, [foldersById, childrenByParent, expandedFolderIds]);
}

export function useAncestorIds(folderId: string | null): string[] {
  const foldersById = useDataStore((s) => s.foldersById);
  return useMemo(() => {
    const ancestors: string[] = [];
    let cursor = folderId ? foldersById[folderId]?.parentId ?? null : null;
    const visited = new Set<string>();
    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      ancestors.push(cursor);
      cursor = foldersById[cursor]?.parentId ?? null;
    }
    return ancestors;
  }, [folderId, foldersById]);
}
