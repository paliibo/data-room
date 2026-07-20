import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, ChevronDown, Menu, Pencil, Trash2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import { NameDialog } from "@/components/shared/NameDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PdfPreviewDialog } from "@/features/preview/PdfPreviewDialog";
import { Sidebar } from "@/features/browser/Sidebar";
import { Breadcrumbs } from "@/features/browser/Breadcrumbs";
import { Toolbar } from "@/features/browser/Toolbar";
import { ContentView } from "@/features/browser/ContentView";
import { UploadDropzone } from "@/features/browser/UploadDropzone";
import { itemName } from "@/features/browser/utils";
import { useDataStore } from "@/store/dataStore";
import { useUiStore } from "@/store/uiStore";
import { useDataroom, useDatarooms } from "@/hooks/useDatarooms";
import { useFolderContents } from "@/hooks/useFolderContents";
import { useAncestorIds } from "@/hooks/useFolderTree";
import { useUpload } from "@/hooks/useUpload";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { downloadFile } from "@/lib/download";
import type { BrowserItem, ItemActions } from "@/features/browser/types";
import type { BrowserDialogState } from "@/pages/types";
import type { DragPayload } from "@/lib/dnd";
import type { FileItem } from "@/types";

export default function DataroomPage() {
  const { dataroomId = "", folderId: folderIdParam } = useParams();
  const navigate = useNavigate();
  const folderId = folderIdParam ?? null;

  const { status: dataroomsStatus } = useDatarooms();
  const dataroom = useDataroom(dataroomId);
  const {
    contentStatus,
    foldersById,
    openDataroom,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    renameFile,
    deleteFile,
    moveFile,
    createDataroom,
  } = useDataStore(
    useShallow((s) => ({
      contentStatus: s.contentStatus,
      foldersById: s.foldersById,
      openDataroom: s.openDataroom,
      createFolder: s.createFolder,
      renameFolder: s.renameFolder,
      deleteFolder: s.deleteFolder,
      moveFolder: s.moveFolder,
      renameFile: s.renameFile,
      deleteFile: s.deleteFile,
      moveFile: s.moveFile,
      createDataroom: s.createDataroom,
    })),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [dialog, setDialog] = useState<BrowserDialogState>({ type: "closed" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const openFilePickerRef = useRef<() => void>(() => {});

  const { folders, files, status } = useFolderContents(folderId, searchQuery);
  const { upload, isUploading } = useUpload(folderId);
  const ancestorIds = useAncestorIds(folderId);
  const expandFolders = useUiStore((s) => s.expandFolders);

  useEffect(() => {
    if (dataroomId) {
      openDataroom(dataroomId).catch(() => undefined);
    }
  }, [dataroomId, openDataroom]);

  useEffect(() => {
    const ids = folderId ? [...ancestorIds, folderId] : ancestorIds;
    if (ids.length > 0) expandFolders(ids);
  }, [ancestorIds, folderId, expandFolders]);

  useEffect(() => {
    setSelectedId(null);
    setSearchQuery("");
    setSidebarOpen(false);
  }, [folderId, dataroomId]);

  const currentFolder = folderId ? foldersById[folderId] : null;

  const pendingParentAfterDeleteRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (contentStatus === "ready" && folderId && !foldersById[folderId]) {
      const intendedParent = pendingParentAfterDeleteRef.current;
      pendingParentAfterDeleteRef.current = undefined;
      if (intendedParent !== undefined) {
        navigate(
          intendedParent ? `/d/${dataroomId}/f/${intendedParent}` : `/d/${dataroomId}`,
          { replace: true },
        );
      } else {
        toast.info("That folder no longer exists");
        navigate(`/d/${dataroomId}`, { replace: true });
      }
    }
  }, [contentStatus, folderId, foldersById, dataroomId, navigate]);

  const navigateToFolder = useCallback(
    (target: string | null) => {
      navigate(target ? `/d/${dataroomId}/f/${target}` : `/d/${dataroomId}`);
    },
    [navigate, dataroomId],
  );

  const handleMoveItem = useCallback(
    async (payload: DragPayload, targetFolderId: string | null) => {
      try {
        if (payload.kind === "folder") {
          await moveFolder(payload.id, targetFolderId);
        } else {
          await moveFile(payload.id, targetFolderId);
        }
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

  const handleDelete = useCallback(
    async (item: BrowserItem) => {
      if (item.kind === "file") {
        await deleteFile(item.file.id);
        toast.success(`Deleted "${item.file.name}"`);
        return;
      }
      const { foldersById: currentFolders } = useDataStore.getState();
      let cursor = folderId;
      while (cursor) {
        if (cursor === item.folder.id) {
          pendingParentAfterDeleteRef.current = item.folder.parentId;
          break;
        }
        cursor = currentFolders[cursor]?.parentId ?? null;
      }
      await deleteFolder(item.folder.id);
      toast.success(`Deleted "${item.folder.name}"`);
    },
    [deleteFile, deleteFolder, folderId],
  );

  const actions: ItemActions = useMemo(
    () => ({
      onOpenFolder: navigateToFolder,
      onPreviewFile: setPreviewFile,
      onRename: (item) => setDialog({ type: "rename-item", item }),
      onDelete: (item) => setDialog({ type: "delete-item", item }),
      onDownload: (file) => {
        downloadFile(file.id, file.name).catch((error: unknown) => {
          toast.error("Download failed", {
            description: error instanceof Error ? error.message : undefined,
          });
        });
      },
      onMoveItem: handleMoveItem,
    }),
    [navigateToFolder, handleMoveItem],
  );

  const selectedItem: BrowserItem | null = useMemo(() => {
    if (!selectedId) return null;
    const folder = folders.find((f) => f.id === selectedId);
    if (folder) return { kind: "folder", folder };
    const file = files.find((f) => f.id === selectedId);
    if (file) return { kind: "file", file };
    return null;
  }, [selectedId, folders, files]);

  useKeyboardShortcuts(
    useMemo(
      () => ({
        n: () => setDialog({ type: "create-folder" }),
        u: () => openFilePickerRef.current(),
        g: () => useUiStore.getState().toggleViewMode(),
        "/": () => searchInputRef.current?.focus(),
        f2: () => {
          if (selectedItem) setDialog({ type: "rename-item", item: selectedItem });
        },
        delete: () => {
          if (selectedItem) setDialog({ type: "delete-item", item: selectedItem });
        },
        escape: () => setSelectedId(null),
        enter: () => {
          if (!selectedItem) return;
          if (selectedItem.kind === "folder") navigateToFolder(selectedItem.folder.id);
          else setPreviewFile(selectedItem.file);
        },
      }),
      [selectedItem, navigateToFolder],
    ),
    dialog.type === "closed" && !previewFile,
  );

  if (dataroomsStatus === "ready" && !dataroom) {
    return (
      <div className="flex h-dvh items-center justify-center p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Dataroom not found"
          description="It may have been deleted, or the link is out of date."
          action={
            <Button onClick={() => navigate("/")}>Back to datarooms</Button>
          }
          className="w-full max-w-md border-none"
        />
      </div>
    );
  }

  if (!dataroom) {
    return <div className="h-dvh" aria-busy="true" />;
  }

  if (contentStatus === "error") {
    return (
      <div className="flex h-dvh items-center justify-center p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load this dataroom"
          description="Local storage is unavailable. Close other tabs using this app, free up disk space, or try a non-private browser window."
          action={
            <Button onClick={() => openDataroom(dataroomId).catch(() => undefined)}>
              Try again
            </Button>
          }
          className="w-full max-w-md border-none"
        />
      </div>
    );
  }

  const sidebar = (
    <Sidebar
      dataroom={dataroom}
      activeFolderId={folderId}
      onNavigate={navigateToFolder}
      onMoveItem={handleMoveItem}
      onCreateDataroom={() => setDialog({ type: "create-dataroom" })}
    />
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden md:block">{sidebar}</div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">{sidebar}</div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu aria-hidden />
            </Button>
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
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onSelect={() =>
                      setDialog({
                        type: "rename-item",
                        item: { kind: "folder", folder: currentFolder },
                      })
                    }
                  >
                    <Pencil />
                    Rename folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() =>
                      setDialog({
                        type: "delete-item",
                        item: { kind: "folder", folder: currentFolder },
                      })
                    }
                  >
                    <Trash2 className="text-destructive" />
                    Delete folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isUploading && (
              <span className="ml-auto text-xs text-muted-foreground" role="status">
                Uploading…
              </span>
            )}
          </div>
          <Toolbar
            ref={searchInputRef}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewFolder={() => setDialog({ type: "create-folder" })}
            onUpload={() => openFilePickerRef.current()}
          />
        </header>

        <UploadDropzone
          onFiles={upload}
          onOpenRef={(open) => (openFilePickerRef.current = open)}
        >
          <div
            className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedId(null);
            }}
          >
            <ContentView
              folders={folders}
              files={files}
              status={status}
              searchQuery={searchQuery}
              selectedId={selectedId}
              onSelect={setSelectedId}
              actions={actions}
              onUpload={() => openFilePickerRef.current()}
              onNewFolder={() => setDialog({ type: "create-folder" })}
            />
          </div>
        </UploadDropzone>
      </main>

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
        title={dialog.type === "rename-item" && dialog.item.kind === "file" ? "Rename file" : "Rename folder"}
        initialValue={dialog.type === "rename-item" ? itemName(dialog.item) : ""}
        submitLabel="Rename"
        onSubmit={async (name) => {
          if (dialog.type !== "rename-item") return;
          if (dialog.item.kind === "folder") {
            await renameFolder(dialog.item.folder.id, name);
          } else {
            await renameFile(dialog.item.file.id, name);
          }
          toast.success("Renamed");
        }}
      />

      <DeleteConfirmDialog
        open={dialog.type === "delete-item"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        title={
          dialog.type === "delete-item"
            ? `Delete "${itemName(dialog.item)}"?`
            : "Delete?"
        }
        description={
          dialog.type === "delete-item" && dialog.item.kind === "folder"
            ? "This permanently deletes the folder and everything inside it, including all nested folders and files. This cannot be undone."
            : "This permanently deletes the file. This cannot be undone."
        }
        onConfirm={async () => {
          if (dialog.type !== "delete-item") return;
          try {
            await handleDelete(dialog.item);
          } catch (error) {
            toast.error("Couldn't delete", {
              description: error instanceof Error ? error.message : undefined,
            });
          }
        }}
      />

      <PdfPreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </div>
  );
}
