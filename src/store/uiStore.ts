import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UiState } from "@/store/types";

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      viewMode: "grid",
      sortField: "name",
      sortDirection: "asc",
      expandedFolderIds: {},
      sidebarOpen: false,

      setViewMode: (viewMode) => set({ viewMode }),
      toggleViewMode: () =>
        set((s) => ({ viewMode: s.viewMode === "grid" ? "list" : "grid" })),
      setSort: (field) =>
        set((s) => ({
          sortField: field,
          sortDirection:
            s.sortField === field && s.sortDirection === "asc" ? "desc" : "asc",
        })),
      toggleFolderExpanded: (folderId) =>
        set((s) => {
          const expanded = { ...s.expandedFolderIds };
          if (expanded[folderId]) delete expanded[folderId];
          else expanded[folderId] = true;
          return { expandedFolderIds: expanded };
        }),
      expandFolders: (folderIds) =>
        set((s) => ({
          expandedFolderIds: {
            ...s.expandedFolderIds,
            ...Object.fromEntries(folderIds.map((id) => [id, true as const])),
          },
        })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: "dataroom-ui",
      partialize: (s) => ({
        viewMode: s.viewMode,
        sortField: s.sortField,
        sortDirection: s.sortDirection,
        expandedFolderIds: s.expandedFolderIds,
      }),
    },
  ),
);
