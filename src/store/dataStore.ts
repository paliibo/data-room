import { create } from "zustand";
import type { DataState } from "@/store/types";
import { createCoreSlice } from "@/store/slices/coreSlice";
import { createTrashSlice } from "@/store/slices/trashSlice";
import { createTagSlice } from "@/store/slices/tagSlice";
import { createShareSlice } from "@/store/slices/shareSlice";
import { createActivitySlice } from "@/store/slices/activitySlice";
import { createChecklistSlice } from "@/store/slices/checklistSlice";

/**
 * One normalized client-side database for the open dataroom, assembled from
 * slices so each domain (tree, trash, tags, sharing, audit, checklist) stays
 * readable on its own while sharing a single `get()`/`set()`.
 */
export const useDataStore = create<DataState>()((...args) => ({
  ...createCoreSlice(...args),
  ...createTrashSlice(...args),
  ...createTagSlice(...args),
  ...createShareSlice(...args),
  ...createActivitySlice(...args),
  ...createChecklistSlice(...args),
}));
