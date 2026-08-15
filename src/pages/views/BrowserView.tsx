import { useCallback, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { ChevronDown, Link2, Pencil, Star, Trash2, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "@/features/browser/Breadcrumbs";
import { Toolbar } from "@/features/browser/Toolbar";
import { ContentView } from "@/features/browser/ContentView";
import { BulkActionBar } from "@/features/browser/BulkActionBar";
import { SCOPE_COPY, itemId, rangeBetween } from "@/features/browser/utils";
import { useDataStore } from "@/store/dataStore";
import { useSelectionStore, useUiStore } from "@/store/uiStore";
import { useFolderContents } from "@/hooks/useFolderContents";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { collectZipEntries, downloadFile, downloadZip } from "@/lib/download";
import { parentKey } from "@/store/utils";
import type { BrowserItem, ItemActions } from "@/features/browser/types";
import type { BrowserViewProps, DataroomOutletContext } from "@/pages/types";
import type { DragPayload } from "@/lib/dnd";
import type { FileItem, Folder } from "@/types";

export default function BrowserView({ scope }: BrowserViewProps) {
  const ctx = useOutletContext<DataroomOutletContext>();
  const {
    dataroom,
    folderId,
    currentFolder,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    previewFile,
    openShareDialog,
    openNewFolderDialog,
    openFilePicker,
    openTagEditor,
    openRenameDialog,
    openPurgeDialog,
    navigateToFolder,
    openEmptyTrashDialog,
    isUploading,
  } = ctx;

  const store = useDataStore(
    useShallow((s) => ({
      moveFolder: s.moveFolder,
      moveFile: s.moveFile,
      toggleStar: s.toggleStar,
      trashFolder: s.trashFolder,
      trashFile: s.trashFile,
      trashMany: s.trashMany,
      restore: s.restore,
      logActivity: s.logActivity,
    })),
  );
  const { selectedIds, select, toggle, selectRange, clear } = useSelectionStore(
    useShallow((s) => ({
      selectedIds: s.selectedIds,
      select: s.select,
      toggle: s.toggle,
      selectRange: s.selectRange,
      clear: s.clear,
    })),
  );
  const clearTagFilter = useUiStore((s) => s.clearTagFilter);
  const tagFilterCount = useUiStore((s) => s.tagFilter.length);

  const { folders, files, status, filteredOut } = useFolderContents({
    scope,
    folderId,
    searchQuery,
  });
  const [isZipping, setIsZipping] = useState(false);
  const anchorRef = useRef<string | null>(null);

  const orderedIds = useMemo(
    () => [...folders.map((f) => f.id), ...files.map((f) => f.id)],
    [folders, files],
  );

  const handleSelect = useCallback(
    (id: string, event: React.MouseEvent | React.KeyboardEvent) => {
      if (event.shiftKey) {
        selectRange(rangeBetween(orderedIds, anchorRef.current, id));
        return;
      }
      if (event.metaKey || event.ctrlKey) {
        anchorRef.current = id;
        toggle(id);
        return;
      }
      anchorRef.current = id;
      select(id);
    },
    [orderedIds, select, toggle, selectRange],
  );

  const handleToggleSelect = useCallback(
    (id: string) => {
      anchorRef.current = id;
      toggle(id);
    },
    [toggle],
  );

  const selectedItems: BrowserItem[] = useMemo(() => {
    const set = new Set(selectedIds);
    return [
      ...folders.filter((f) => set.has(f.id)).map((folder) => ({ kind: "folder" as const, folder })),
      ...files.filter((f) => set.has(f.id)).map((file) => ({ kind: "file" as const, file })),
    ];
  }, [selectedIds, folders, files]);

  const handleMoveItem = useCallback(
    async (payload: DragPayload, targetFolderId: string | null) => {
      try {
        if (payload.kind === "folder") await store.moveFolder(payload.id, targetFolderId);
        else await store.moveFile(payload.id, targetFolderId);
        toast.success("Moved");
      } catch (error) {
        toast.error("Couldn't move item", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    },
    [store],
  );

  /** Trash with an inline undo — the reason delete is soft in the first place. */
  const trashWithUndo = useCallback(
    async (label: string, run: () => Promise<{ folderIds: string[]; fileIds: string[] }>) => {
      try {
        const result = await run();
        clear();
        toast.success(`Moved ${label} to trash`, {
          action: {
            label: "Undo",
            onClick: () => {
              store.restore(result).catch(() => toast.error("Couldn't restore"));
            },
          },
        });
      } catch (error) {
        toast.error("Couldn't move to trash", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    },
    [store, clear],
  );

  const downloadFolderZip = useCallback(
    async (folder: Folder | null) => {
      setIsZipping(true);
      try {
        const { foldersById, filesById, childrenByParent } = useDataStore.getState();
        const entries = collectZipEntries(
          folder,
          foldersById,
          filesById,
          childrenByParent,
          parentKey(null),
        );
        const count = await downloadZip(entries, folder?.name ?? dataroom.name);
        toast.success(`Exported ${count} document${count === 1 ? "" : "s"}`);
      } catch (error) {
        toast.error("Couldn't build the archive", {
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        setIsZipping(false);
      }
    },
    [dataroom.name],
  );

  const downloadOne = useCallback(
    (file: FileItem) => {
      downloadFile(file.id, file.name)
        .then(() =>
          store.logActivity({
            type: "file.download",
            targetId: file.id,
            targetName: file.name,
          }),
        )
        .catch((error: unknown) => {
          toast.error("Download failed", {
            description: error instanceof Error ? error.message : undefined,
          });
        });
    },
    [store],
  );

  const actions: ItemActions = useMemo(
    () => ({
      onOpenFolder: navigateToFolder,
      onPreviewFile: previewFile,
      onRename: openRenameDialog,
      onTrash: (item) =>
        trashWithUndo(`"${item.kind === "folder" ? item.folder.name : item.file.name}"`, () =>
          item.kind === "folder" ? store.trashFolder(item.folder.id) : store.trashFile(item.file.id),
        ),
      onRestore: (item) => {
        const payload =
          item.kind === "folder"
            ? { folderIds: [item.folder.id], fileIds: [] }
            : { folderIds: [], fileIds: [item.file.id] };
        store.restore(payload).then(() => toast.success("Restored")).catch(() => toast.error("Couldn't restore"));
      },
      onPurge: openPurgeDialog,
      onDownload: downloadOne,
      onDownloadFolder: (folder) => downloadFolderZip(folder),
      onMoveItem: handleMoveItem,
      onToggleStar: (item) =>
        store.toggleStar(item.kind, itemId(item)).catch(() => toast.error("Couldn't update the star")),
      onEditTags: openTagEditor,
      onShare: openShareDialog,
    }),
    [
      navigateToFolder,
      previewFile,
      openRenameDialog,
      openPurgeDialog,
      openTagEditor,
      openShareDialog,
      handleMoveItem,
      downloadOne,
      downloadFolderZip,
      trashWithUndo,
      store,
    ],
  );

  useKeyboardShortcuts(
    useMemo(
      () => ({
        n: openNewFolderDialog,
        u: openFilePicker,
        g: () => useUiStore.getState().toggleViewMode(),
        "/": () => searchInputRef.current?.focus(),
        "mod+a": () => selectRange(orderedIds),
        escape: () => clear(),
        s: () => {
          for (const item of selectedItems) {
            store.toggleStar(item.kind, itemId(item)).catch(() => undefined);
          }
        },
        f2: () => {
          if (selectedItems.length === 1) openRenameDialog(selectedItems[0]);
        },
        delete: () => {
          if (selectedItems.length === 0) return;
          if (scope === "trash") {
            if (selectedItems.length === 1) openPurgeDialog(selectedItems[0]);
            return;
          }
          trashWithUndo(`${selectedItems.length} item${selectedItems.length === 1 ? "" : "s"}`, () =>
            store.trashMany(
              selectedItems.filter((i) => i.kind === "folder").map((i) => itemId(i)),
              selectedItems.filter((i) => i.kind === "file").map((i) => itemId(i)),
            ),
          );
        },
        enter: () => {
          if (selectedItems.length !== 1) return;
          const item = selectedItems[0];
          if (item.kind === "folder") navigateToFolder(item.folder.id);
          else previewFile(item.file);
        },
      }),
      [
        openNewFolderDialog,
        openFilePicker,
        searchInputRef,
        orderedIds,
        selectRange,
        clear,
        selectedItems,
        scope,
        store,
        trashWithUndo,
        openRenameDialog,
        openPurgeDialog,
        navigateToFolder,
        previewFile,
      ],
    ),
  );

  const copy = SCOPE_COPY[scope];

  return (
    <>
      <header className="flex flex-col gap-3 border-b px-4 py-3 pl-12 sm:px-6 md:pl-6">
        <div className="flex min-h-8 items-center gap-2">
          {scope === "folder" ? (
            <>
              <Breadcrumbs
                folderId={folderId}
                onNavigate={navigateToFolder}
                onMoveItem={handleMoveItem}
              />
              {currentFolder && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for folder ${currentFolder.name}`}
                    >
                      <ChevronDown aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem
                      onSelect={() =>
                        openRenameDialog({ kind: "folder", folder: currentFolder })
                      }
                    >
                      <Pencil />
                      Rename folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openShareDialog(currentFolder.id)}>
                      <Link2 />
                      Share this folder
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        store
                          .toggleStar("folder", currentFolder.id)
                          .catch(() => toast.error("Couldn't update the star"))
                      }
                    >
                      <Star />
                      {currentFolder.starred ? "Remove star" : "Add star"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() =>
                        trashWithUndo(`"${currentFolder.name}"`, () =>
                          store.trashFolder(currentFolder.id),
                        )
                      }
                    >
                      <Trash2 className="text-destructive" />
                      Move to trash
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          ) : (
            <>
              <h1 className="text-sm font-semibold">{copy.title}</h1>
              {scope === "trash" && (folders.length > 0 || files.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={openEmptyTrashDialog}
                >
                  <Trash2 aria-hidden />
                  Empty trash
                </Button>
              )}
            </>
          )}

          {isUploading && (
            <span className="ml-auto text-xs text-muted-foreground" role="status">
              Uploading…
            </span>
          )}
          {isZipping && (
            <span className="ml-auto text-xs text-muted-foreground" role="status">
              Building archive…
            </span>
          )}
        </div>

        <Toolbar
          searchInputRef={searchInputRef}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewFolder={openNewFolderDialog}
          onUpload={openFilePicker}
          onShare={() => openShareDialog(folderId)}
          scope={scope}
        />

        {tagFilterCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="brand">
              {tagFilterCount} tag filter{tagFilterCount === 1 ? "" : "s"}
            </Badge>
            {filteredOut > 0 && <span>{filteredOut} hidden</span>}
            <Button variant="ghost" size="icon-xs" onClick={clearTagFilter} aria-label="Clear tag filter">
              <X aria-hidden />
            </Button>
          </div>
        )}
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) clear();
        }}
      >
        <ContentView
          folders={folders}
          files={files}
          status={status}
          scope={scope}
          searchQuery={searchQuery}
          selectedIds={selectedIds}
          actions={actions}
          onSelect={handleSelect}
          onToggleSelect={handleToggleSelect}
          onUpload={openFilePicker}
          onNewFolder={openNewFolderDialog}
          onClearSearch={() => setSearchQuery("")}
        />
      </div>

      <BulkActionBar
        count={selectedIds.length}
        scope={scope}
        onClear={clear}
        onDownload={() => {
          const selectedFiles = selectedItems.filter((i) => i.kind === "file");
          if (selectedFiles.length === 1 && selectedFiles[0].kind === "file") {
            downloadOne(selectedFiles[0].file);
            return;
          }
          downloadZip(
            selectedFiles.map((i) => ({ file: (i as { file: FileItem }).file, path: "" })),
            `${dataroom.name} selection`,
          )
            .then((count) => toast.success(`Exported ${count} documents`))
            .catch((error: unknown) =>
              toast.error("Couldn't build the archive", {
                description: error instanceof Error ? error.message : undefined,
              }),
            );
        }}
        onStar={() => {
          for (const item of selectedItems) {
            store.toggleStar(item.kind, itemId(item)).catch(() => undefined);
          }
        }}
        onTrash={() => {
          if (scope === "trash") {
            if (selectedItems.length === 1) openPurgeDialog(selectedItems[0]);
            return;
          }
          trashWithUndo(`${selectedItems.length} item${selectedItems.length === 1 ? "" : "s"}`, () =>
            store.trashMany(
              selectedItems.filter((i) => i.kind === "folder").map((i) => itemId(i)),
              selectedItems.filter((i) => i.kind === "file").map((i) => itemId(i)),
            ),
          );
        }}
        onRestore={() => {
          store
            .restore({
              folderIds: selectedItems.filter((i) => i.kind === "folder").map((i) => itemId(i)),
              fileIds: selectedItems.filter((i) => i.kind === "file").map((i) => itemId(i)),
            })
            .then(() => {
              clear();
              toast.success("Restored");
            })
            .catch(() => toast.error("Couldn't restore"));
        }}
      />
    </>
  );
}
