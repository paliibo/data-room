import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDataStore } from "@/store/dataStore";
import type { Tag } from "@/types";

export function useTags(): Tag[] {
  const { tagsById, tagIds } = useDataStore(
    useShallow((s) => ({ tagsById: s.tagsById, tagIds: s.tagIds })),
  );
  return useMemo(
    () =>
      tagIds
        .map((id) => tagsById[id])
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tagIds, tagsById],
  );
}

/** Resolves a file's tag ids to tag objects, dropping any that no longer exist. */
export function useFileTags(tagIds: string[]): Tag[] {
  const tagsById = useDataStore((s) => s.tagsById);
  return useMemo(
    () => tagIds.map((id) => tagsById[id]).filter((t): t is Tag => Boolean(t)),
    [tagIds, tagsById],
  );
}

/** How many live files carry each tag — drives the counts in the filter menu. */
export function useTagCounts(): Record<string, number> {
  const filesById = useDataStore((s) => s.filesById);
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const file of Object.values(filesById)) {
      if (file.deletedAt) continue;
      for (const id of file.tagIds) counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [filesById]);
}
