import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, Menu } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { NameDialog } from "@/components/shared/NameDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ShortcutsDialog } from "@/components/shared/ShortcutsDialog";
import { PdfPreviewDialog } from "@/features/preview/PdfPreviewDialog";
import { TagEditorDialog } from "@/features/tags/TagEditorDialog";
import { ShareDialog } from "@/features/share/ShareDialog";
import { CommandPalette } from "@/features/command/CommandPalette";
import { Sidebar } from "@/features/browser/Sidebar";
import { UploadDropzone } from "@/features/browser/UploadDropzone";
import { itemName, scopePath } from "@/features/browser/utils";
import { useDataStore } from "@/store/dataStore";
import { useSelectionStore, useUiStore } from "@/store/uiStore";
import { useDataroom, useDatarooms } from "@/hooks/useDatarooms";
import { useAncestorIds } from "@/hooks/useFolderTree";
import { useUpload } from "@/hooks/useUpload";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { downloadFile } from "@/lib/download";
import { useBrowseScope } from "@/pages/useBrowseScope";
import type { BrowserItem } from "@/features/browser/types";
import type { BrowserDialogState, DataroomOutletContext } from "@/pages/types";
import type { DragPayload } from "@/lib/dnd";
import type { FileItem } from "@/types";

/**
 * The dataroom shell. It owns navigation chrome, every dialog and the file
 * picker; child views receive them through the outlet context rather than
 * rebuilding the same wiring per route.
 */
export default function DataroomLayout() {
  const { dataroomId = "", folderId: folderIdParam } = useParams();
  const navigate = useNavigate();
  const folderId = folderIdParam ?? null;
  const scope = useBrowseScope();

  const { status: dataroomsStatus } = useDatarooms();
  const dataroom = useDataroom(dataroomId);
  const { contentStatus, foldersById, openDataroom, createFolder, renameFolder, renameFile, moveFolder, moveFile, createDataroom } =
    useDataStore(
      useShallow((s) => ({
        contentStatus: s.contentStatus,
        foldersById: s.foldersById,
        openDataroom: s.openDataroom,
        createFolder: s.createFolder,
        renameFolder: s.renameFolder,
        renameFile: s.renameFile,
        moveFolder: s.moveFolder,
        moveFile: s.moveFile,
        createDataroom: s.createDataroom,
      })),
    );
  const purgeFolder = useDataStore((s) => s.purgeFolder);
  const purgeFile = useDataStore((s) => s.purgeFile);
  const emptyTrash = useDataStore((s) => s.emptyTrash);

  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [tagEditorFile, setTagEditorFile] = useState<FileItem | null>(null);
  const [shareTarget, setShareTarget] = useState<{ folderId: string | null } | null>(null);
  const [dialog, setDialog] = useState<BrowserDialogState>({ type: "closed" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const openFilePickerRef = useRef<() => void>(() => {});
  const pendingParentAfterDeleteRef = useRef<string | null | undefined>(undefined);

  const { upload, isUploading } = useUpload(folderId);
  const ancestorIds = useAncestorIds(folderId);
  const expandFolders = useUiStore((s) => s.expandFolders);
  const setScope = useSelectionStore((s) => s.setScope);

  useEffect(() => {
    if (dataroomId) openDataroom(dataroomId).catch(() => undefined);
  }, [dataroomId, openDataroom]);

  useEffect(() => {
    const ids = folderId ? [...ancestorIds, folderId] : ancestorIds;
    if (ids.length > 0) expandFolders(ids);
  }, [ancestorIds, folderId, expandFolders]);

  useEffect(() => {
    setSearchQuery("");
    setSidebarOpen(false);
    setScope(scope);
  }, [folderId, dataroomId, scope, setScope]);

  const currentFolder = folderId ? foldersById[folderId] ?? null : null;

  // A folder can vanish under you — deleted here, or gone from a stale URL.
  useEffect(() => {
    if (contentStatus !== "ready" || !folderId) return;
    const folder = foldersById[folderId];
    if (folder && !folder.deletedAt) return;

    const intendedParent = pendingParentAfterDeleteRef.current;
    pendingParentAfterDeleteRef.current = undefined;
    if (intendedParent !== undefined) {
      navigate(scopePath(dataroomId, "folder", intendedParent), { replace: true });
    } else if (!folder) {
      toast.info("That folder no longer exists");
      navigate(scopePath(dataroomId, "folder"), { replace: true });
    } else {
      navigate(scopePath(dataroomId, "folder", folder.parentId), { replace: true });
    }
  }, [contentStatus, folderId, foldersById, dataroomId, navigate]);

  const navigateToFolder = useCallback(
    (target: string | null) => navigate(scopePath(dataroomId, "folder", target)),
    [navigate, dataroomId],
  );

  const handleMoveItem = useCallback(
    async (payload: DragPayload, targetFolderId: string | null) => {
      try {
        if (payload.kind === "folder") await moveFolder(payload.id, targetFolderId);
        else await moveFile(payload.id, targetFolderId);
        const targetName = targetFolderId
          ? foldersById[targetFolderId]?.name ?? "folder"
          : "the dataroom root";
        toast.success(`Moved to ${targetName}`);
      } catch (error) {
        toast.error("Couldn't move item", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    },
    [moveFolder, moveFile, foldersById],
  );

  /** Remembers where to land if you delete the folder you are standing in. */
  const rememberParentBeforeDelete = useCallback(
    (item: BrowserItem) => {
      if (item.kind !== "folder") return;
      let cursor = folderId;
      const { foldersById: current } = useDataStore.getState();
      while (cursor) {
        if (cursor === item.folder.id) {
          pendingParentAfterDeleteRef.current = item.folder.parentId;
          return;
        }
        cursor = current[cursor]?.parentId ?? null;
      }
    },
    [folderId],
  );

  useKeyboardShortcuts(
    useMemo(
      () => ({
        "mod+k": () => setPaletteOpen((open) => !open),
        "?": () => setShortcutsOpen(true),
        "mod+shift+s": () => setShareTarget({ folderId }),
      }),
      [folderId],
    ),
    !previewFile,
  );

  const context: DataroomOutletContext = useMemo(
    () => ({
      dataroom: dataroom!,
      folderId,
      currentFolder,
      searchQuery,
      setSearchQuery,
      searchInputRef,
      previewFile: setPreviewFile,
      openShareDialog: (target) => setShareTarget({ folderId: target }),
      openNewFolderDialog: () => setDialog({ type: "create-folder" }),
      openFilePicker: () => openFilePickerRef.current(),
      openTagEditor: setTagEditorFile,
      openRenameDialog: (item) => setDialog({ type: "rename-item", item }),
      openPurgeDialog: (item) => {
        rememberParentBeforeDelete(item);
        setDialog({ type: "purge-item", item });
      },
      openEmptyTrashDialog: () => setDialog({ type: "empty-trash" }),
      navigateToFolder,
      isUploading,
      upload,
    }),
    [
      dataroom,
      folderId,
      currentFolder,
      searchQuery,
      navigateToFolder,
      isUploading,
      upload,
      rememberParentBeforeDelete,
    ],
  );

  if (dataroomsStatus === "ready" && !dataroom) {
    return (
      <div className="flex h-dvh items-center justify-center p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Dataroom not found"
          description="It may have been deleted, or the link is out of date."
          action={<Button onClick={() => navigate("/")}>Back to datarooms</Button>}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  if (!dataroom) return <div className="h-dvh" aria-busy="true" />;

  if (contentStatus === "error") {
    return (
      <div className="flex h-dvh items-center justify-center p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load this dataroom"
          description="Local storage is unavailable. Close other tabs using this app, free up disk space, or try a non-private window."
          action={
            <Button onClick={() => openDataroom(dataroomId).catch(() => undefined)}>
              Try again
            </Button>
          }
          className="w-full max-w-md"
        />
      </div>
    );
  }

  const sidebar = (
    <Sidebar
      dataroom={dataroom}
      activeFolderId={folderId}
      scope={scope}
      onNavigate={navigateToFolder}
      onMoveItem={handleMoveItem}
      onCreateDataroom={() => setDialog({ type: "create-dataroom" })}
      onOpenCommandPalette={() => setPaletteOpen(true)}
    />
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden md:block">{sidebar}</div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 elevate-3">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute left-2 top-2.5 z-30 md:hidden"
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu aria-hidden />
        </Button>

        <UploadDropzone
          onFiles={upload}
          disabled={scope === "trash"}
          onOpenRef={(open) => (openFilePickerRef.current = open)}
        >
          <Outlet context={context} />
        </UploadDropzone>
      </div>

      <NameDialog
        open={dialog.type === "create-folder"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        title="New folder"
        description={`Create a folder in ${currentFolder?.name ?? dataroom.name}.`}
        placeholder="e.g. Financial statements"
        submitLabel="Create"
        onSubmit={async (name) => {
          const folder = await createFolder(folderId, name);
          toast.success(`Created "${folder.name}"`);
        }}
      />

      <NameDialog
        open={dialog.type === "create-dataroom"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        title="New dataroom"
        description="A dataroom is a private workspace for one deal or project."
        placeholder="e.g. Project Atlas — Series B"
        submitLabel="Create"
        onSubmit={async (name) => {
          const room = await createDataroom(name);
          toast.success(`Created "${room.name}"`);
          navigate(`/d/${room.id}`);
        }}
      />

      <NameDialog
        open={dialog.type === "rename-item"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        title={
          dialog.type === "rename-item" && dialog.item.kind === "file"
            ? "Rename file"
            : "Rename folder"
        }
        initialValue={dialog.type === "rename-item" ? itemName(dialog.item) : ""}
        submitLabel="Rename"
        onSubmit={async (name) => {
          if (dialog.type !== "rename-item") return;
          if (dialog.item.kind === "folder") await renameFolder(dialog.item.folder.id, name);
          else await renameFile(dialog.item.file.id, name);
          toast.success("Renamed");
        }}
      />

      <DeleteConfirmDialog
        open={dialog.type === "purge-item"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        title={
          dialog.type === "purge-item"
            ? `Permanently delete "${itemName(dialog.item)}"?`
            : "Delete?"
        }
        description={
          dialog.type === "purge-item" && dialog.item.kind === "folder"
            ? "This erases the folder and everything inside it from local storage. It cannot be undone."
            : "This erases the file from local storage. It cannot be undone."
        }
        confirmLabel="Delete permanently"
        onConfirm={async () => {
          if (dialog.type !== "purge-item") return;
          try {
            if (dialog.item.kind === "folder") await purgeFolder(dialog.item.folder.id);
            else await purgeFile(dialog.item.file.id);
            toast.success(`Deleted "${itemName(dialog.item)}"`);
          } catch (error) {
            toast.error("Couldn't delete", {
              description: error instanceof Error ? error.message : undefined,
            });
          }
        }}
      />

      <DeleteConfirmDialog
        open={dialog.type === "empty-trash"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        title="Empty the trash?"
        description="Every folder and file in the trash will be erased from local storage. This cannot be undone."
        confirmLabel="Empty trash"
        onConfirm={async () => {
          const count = await emptyTrash();
          toast.success(`Deleted ${count} item${count === 1 ? "" : "s"}`);
        }}
      />

      <PdfPreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        onEditTags={(file) => {
          setPreviewFile(null);
          setTagEditorFile(file);
        }}
        onDownload={(file) => {
          downloadFile(file.id, file.name)
            .then(() =>
              useDataStore
                .getState()
                .logActivity({ type: "file.download", targetId: file.id, targetName: file.name }),
            )
            .catch((error: unknown) => {
              toast.error("Download failed", {
                description: error instanceof Error ? error.message : undefined,
              });
            });
        }}
      />

      <TagEditorDialog
        file={tagEditorFile}
        onOpenChange={(open) => !open && setTagEditorFile(null)}
      />

      <ShareDialog
        open={Boolean(shareTarget)}
        onOpenChange={(open) => !open && setShareTarget(null)}
        folderId={shareTarget?.folderId ?? null}
        folder={shareTarget?.folderId ? foldersById[shareTarget.folderId] : null}
        dataroomName={dataroom.name}
      />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        dataroomId={dataroomId}
        onPreviewFile={setPreviewFile}
        onNewFolder={() => setDialog({ type: "create-folder" })}
        onUpload={() => openFilePickerRef.current()}
        onShare={() => setShareTarget({ folderId })}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}

export { DataroomLayout };
