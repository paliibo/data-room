import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SelectionState, UiState } from "@/store/types";

/** View preferences. Persisted to localStorage — harmless to lose, nice to keep. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      viewMode: "grid",
      sortField: "name",
      sortDirection: "asc",
      expandedFolderIds: {},
      sidebarOpen: false,
      density: "comfortable",
      tagFilter: [],

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
      collapseAll: () => set({ expandedFolderIds: {} }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleDensity: () =>
        set((s) => ({
          density: s.density === "comfortable" ? "compact" : "comfortable",
        })),
      toggleTagFilter: (tagId) =>
        set((s) => ({
          tagFilter: s.tagFilter.includes(tagId)
            ? s.tagFilter.filter((id) => id !== tagId)
            : [...s.tagFilter, tagId],
        })),
      clearTagFilter: () => set({ tagFilter: [] }),
    }),
    {
      name: "dataroom-ui",
      partialize: (s) => ({
        viewMode: s.viewMode,
        sortField: s.sortField,
        sortDirection: s.sortDirection,
        expandedFolderIds: s.expandedFolderIds,
        density: s.density,
      }),
    },
  ),
);

/**
 * Selection is deliberately its own store: it changes on every click, and
 * keeping it out of `uiStore` stops persisted preferences from re-serializing
 * on each keystroke of a shift-click sweep.
 */
export const useSelectionStore = create<SelectionState>()((set) => ({
  scope: "folder",
  selectedIds: [],

  setScope: (scope) => set({ scope, selectedIds: [] }),
  select: (id) => set({ selectedIds: id ? [id] : [] }),
  toggle: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((i) => i !== id)
        : [...s.selectedIds, id],
    })),
  selectRange: (ids) => set({ selectedIds: ids }),
  clear: () => set({ selectedIds: [] }),
}));
