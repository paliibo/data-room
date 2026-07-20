import { useEffect } from "react";
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

  const datarooms: Dataroom[] = dataroomIds
    .map((id) => dataroomsById[id])
    .filter(Boolean);

  return {
    status,
    storageError,
    datarooms,
    createDataroom: useDataStore.getState().createDataroom,
    renameDataroom: useDataStore.getState().renameDataroom,
    deleteDataroom: useDataStore.getState().deleteDataroom,
  };
}

export function useDataroom(dataroomId: string | undefined): Dataroom | undefined {
  return useDataStore((s) =>
    dataroomId ? s.dataroomsById[dataroomId] : undefined,
  );
}
