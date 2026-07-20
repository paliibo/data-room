import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDataStore } from "@/store/dataStore";
import type { Breadcrumb } from "@/hooks/types";

export function useBreadcrumbs(folderId: string | null): Breadcrumb[] {
  const { foldersById, activeDataroomId, dataroomsById } = useDataStore(
    useShallow((s) => ({
      foldersById: s.foldersById,
      activeDataroomId: s.activeDataroomId,
      dataroomsById: s.dataroomsById,
    })),
  );

  return useMemo(() => {
    const dataroom = activeDataroomId ? dataroomsById[activeDataroomId] : null;
    const crumbs: Breadcrumb[] = [
      { id: null, name: dataroom?.name ?? "Dataroom" },
    ];
    const chain: Breadcrumb[] = [];
    let cursor = folderId;
    const visited = new Set<string>();
    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      const folder = foldersById[cursor];
      if (!folder) break;
      chain.unshift({ id: folder.id, name: folder.name });
      cursor = folder.parentId;
    }
    return crumbs.concat(chain);
  }, [folderId, foldersById, activeDataroomId, dataroomsById]);
}
