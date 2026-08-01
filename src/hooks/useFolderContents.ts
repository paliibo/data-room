import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDataStore } from "@/store/dataStore";
import { isTrashRoot, parentKey } from "@/store/utils";
import { useUiStore } from "@/store/uiStore";
import { compareItems } from "@/hooks/utils";
import type { FolderContents, UseFolderContentsOptions } from "@/hooks/types";
import type { FileItem, Folder } from "@/types";

const RECENT_LIMIT = 60;

/**
 * Resolves what the content area should show. All four scopes read from the same
 * normalized maps — only the predicate changes — so a starred view and a folder
 * view stay consistent without a second source of truth.
 */
export function useFolderContents({
  scope,
  folderId,
  searchQuery,
}: UseFolderContentsOptions): FolderContents {
  const key = parentKey(folderId);
  const { children, foldersById, filesById, childrenByParent, contentStatus } =
    useDataStore(
      useShallow((s) => ({
        children: s.childrenByParent[key],
        foldersById: s.foldersById,
        filesById: s.filesById,
        childrenByParent: s.childrenByParent,
        contentStatus: s.contentStatus,
      })),
    );
  const { sortField, sortDirection, tagFilter } = useUiStore(
    useShallow((s) => ({
      sortField: s.sortField,
      sortDirection: s.sortDirection,
      tagFilter: s.tagFilter,
    })),
  );

  return useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const matches = (name: string) =>
      query === "" || name.toLocaleLowerCase().includes(query);
    const tree = { foldersById, filesById, childrenByParent };

    let folders: Folder[] = [];
    let files: FileItem[] = [];

    switch (scope) {
      case "folder": {
        folders = (children?.folderIds ?? [])
          .map((id) => foldersById[id])
          .filter((f): f is Folder => Boolean(f) && !f.deletedAt);
        files = (children?.fileIds ?? [])
          .map((id) => filesById[id])
          .filter((f): f is FileItem => Boolean(f) && !f.deletedAt);
        break;
      }
      case "starred": {
        folders = Object.values(foldersById).filter((f) => f.starred && !f.deletedAt);
        files = Object.values(filesById).filter((f) => f.starred && !f.deletedAt);
        break;
      }
      case "recent": {
        files = Object.values(filesById)
          .filter((f) => !f.deletedAt)
          .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
          .slice(0, RECENT_LIMIT);
        break;
      }
      case "trash": {
        // Only the top of each trashed subtree; showing children too would list
        // the same delete twice.
        folders = Object.values(foldersById).filter((f) => isTrashRoot(tree, f));
        files = Object.values(filesById).filter((f) => isTrashRoot(tree, f));
        break;
      }
    }

    const beforeTagFilter = files.length;
    if (tagFilter.length > 0) {
      files = files.filter((file) => tagFilter.every((id) => file.tagIds.includes(id)));
      // A tag filter is a file-level concept; folders would always be filtered out.
      if (scope !== "trash") folders = [];
    }

    folders = folders.filter((f) => matches(f.name));
    files = files.filter((f) => matches(f.name));

    // "Recent" is already ordered by upload time; re-sorting would defeat it.
    if (scope !== "recent") {
      folders.sort((a, b) => compareItems(a, b, sortField, sortDirection));
      files.sort((a, b) => compareItems(a, b, sortField, sortDirection));
    }

    return {
      folders,
      files,
      isEmpty: folders.length === 0 && files.length === 0,
      status: contentStatus,
      filteredOut: Math.max(0, beforeTagFilter - files.length),
    };
  }, [
    scope,
    children,
    foldersById,
    filesById,
    childrenByParent,
    sortField,
    sortDirection,
    searchQuery,
    tagFilter,
    contentStatus,
  ]);
}

/** Live (non-trashed) counts and total size for the open dataroom. */
export function useDataroomStats() {
  const { foldersById, filesById, sharesById } = useDataStore(
    useShallow((s) => ({
      foldersById: s.foldersById,
      filesById: s.filesById,
      sharesById: s.sharesById,
    })),
  );

  return useMemo(() => {
    const files = Object.values(filesById).filter((f) => !f.deletedAt);
    return {
      fileCount: files.length,
      folderCount: Object.values(foldersById).filter((f) => !f.deletedAt).length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      activeShares: Object.values(sharesById).filter(
        (s) => !s.revokedAt && (!s.expiresAt || Date.parse(s.expiresAt) > Date.now()),
      ).length,
    };
  }, [foldersById, filesById, sharesById]);
}

/** How many items are sitting in the trash, for the sidebar badge. */
export function useTrashCount(): number {
  return useDataStore(
    (s) =>
      Object.values(s.foldersById).filter((f) =>
        isTrashRoot(
          { foldersById: s.foldersById, filesById: s.filesById, childrenByParent: s.childrenByParent },
          f,
        ),
      ).length +
      Object.values(s.filesById).filter((f) =>
        isTrashRoot(
          { foldersById: s.foldersById, filesById: s.filesById, childrenByParent: s.childrenByParent },
          f,
        ),
      ).length,
  );
}
