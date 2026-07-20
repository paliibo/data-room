import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDataStore } from "@/store/dataStore";
import { parentKey } from "@/store/utils";
import { useUiStore } from "@/store/uiStore";
import { compareItems } from "@/hooks/utils";
import type { FileItem, Folder } from "@/types";

export function useFolderContents(folderId: string | null, searchQuery = "") {
  const key = parentKey(folderId);
  const { children, foldersById, filesById, contentStatus } = useDataStore(
    useShallow((s) => ({
      children: s.childrenByParent[key],
      foldersById: s.foldersById,
      filesById: s.filesById,
      contentStatus: s.contentStatus,
    })),
  );
  const { sortField, sortDirection } = useUiStore(
    useShallow((s) => ({ sortField: s.sortField, sortDirection: s.sortDirection })),
  );

  return useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const matches = (name: string) =>
      query === "" || name.toLocaleLowerCase().includes(query);

    const folders = (children?.folderIds ?? [])
      .map((id) => foldersById[id])
      .filter((f): f is Folder => Boolean(f) && matches(f.name))
      .sort((a, b) => compareItems(a, b, sortField, sortDirection));
    const files = (children?.fileIds ?? [])
      .map((id) => filesById[id])
      .filter((f): f is FileItem => Boolean(f) && matches(f.name))
      .sort((a, b) => compareItems(a, b, sortField, sortDirection));

    return {
      folders,
      files,
      isEmpty: folders.length === 0 && files.length === 0,
      status: contentStatus,
    };
  }, [children, foldersById, filesById, sortField, sortDirection, searchQuery, contentStatus]);
}
