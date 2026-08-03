import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDataStore } from "@/store/dataStore";
import type { Dataroom } from "@/types";

export function useDatarooms() {
  const { status, dataroomsById, dataroomIds, storageError } = useDataStore(
    useShallow((s) => ({
      status: s.dataroomsStatus,
      dataroomsById: s.dataroomsById,
      dataroomIds: s.dataroomIds,
      storageError: s.storageError,
    })),
  );

  useEffect(() => {
    if (useDataStore.getState().dataroomsStatus === "idle") {
      useDataStore.getState().loadDatarooms().catch(() => undefined);
    }
  }, []);

  const datarooms: Dataroom[] = useMemo(
    () => dataroomIds.map((id) => dataroomsById[id]).filter(Boolean),
    [dataroomIds, dataroomsById],
  );

  return {
    status,
    storageError,
    datarooms,
    createDataroom: useDataStore.getState().createDataroom,
    renameDataroom: useDataStore.getState().renameDataroom,
    updateDataroom: useDataStore.getState().updateDataroom,
    deleteDataroom: useDataStore.getState().deleteDataroom,
    reload: useDataStore.getState().loadDatarooms,
  };
}

export function useDataroom(dataroomId: string | undefined): Dataroom | undefined {
  return useDataStore((s) => (dataroomId ? s.dataroomsById[dataroomId] : undefined));
}

export function useActiveDataroom(): Dataroom | null {
  return useDataStore((s) =>
    s.activeDataroomId ? s.dataroomsById[s.activeDataroomId] ?? null : null,
  );
}
