import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  FolderLock,
  MoreHorizontal,
  Moon,
  Pencil,
  Plus,
  Sun,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { NameDialog } from "@/components/shared/NameDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useDatarooms } from "@/hooks/useDatarooms";
import { useTheme } from "@/hooks/useTheme";
import { destroyDatabase } from "@/storage/indexedDb";
import { formatRelative } from "@/lib/format";
import type { DataroomListDialogState } from "@/pages/types";

export default function DataroomListPage() {
  const navigate = useNavigate();
  const {
    status,
    storageError,
    datarooms,
    createDataroom,
    renameDataroom,
    deleteDataroom,
  } = useDatarooms();
  const { theme, toggleTheme } = useTheme();
  const [dialog, setDialog] = useState<DataroomListDialogState>({ type: "closed" });

  const closeDialog = () => setDialog({ type: "closed" });

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <FolderLock className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-base font-semibold leading-tight">Dataroom</h1>
              <p className="text-xs text-muted-foreground">
                Secure document workspace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
            </Button>
            <Button variant="brand" onClick={() => setDialog({ type: "create" })}>
              <Plus aria-hidden />
              New dataroom
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Your datarooms
        </h2>

        {status === "error" ? (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't access local storage"
            description={
              storageError ??
              "Your browser may be blocking IndexedDB (private mode) or storage may be corrupted."
            }
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => location.reload()}>
                  Reload
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    destroyDatabase()
                      .then(() => location.reload())
                      .catch(() =>
                        toast.error("Could not reset storage. Try clearing site data manually."),
                      );
                  }}
                >
                  Reset local data
                </Button>
              </div>
            }
          />
        ) : status !== "ready" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading datarooms">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : datarooms.length === 0 ? (
          <EmptyState
            icon={FolderLock}
            title="No datarooms yet"
            description="Create your first dataroom to start organizing due-diligence documents."
            action={
              <Button variant="brand" onClick={() => setDialog({ type: "create" })}>
                <Plus aria-hidden />
                Create dataroom
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {datarooms.map((room, index) => (
              <ContextMenu key={room.id}>
                <ContextMenuTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.3) }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open dataroom ${room.name}`}
                    className="group flex cursor-pointer flex-col justify-between gap-6 rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-brand/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => navigate(`/d/${room.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/d/${room.id}`);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                        <FolderLock className="h-5 w-5 text-brand" aria-hidden />
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${room.name}`}
                            className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onSelect={() => setDialog({ type: "rename", dataroom: room })}
                          >
                            <Pencil />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setDialog({ type: "delete", dataroom: room })}
                          >
                            <Trash2 className="text-destructive" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium" title={room.name}>
                        {room.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Updated {formatRelative(room.updatedAt)}
                      </p>
                    </div>
                  </motion.div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => navigate(`/d/${room.id}`)}>
                    Open
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() => setDialog({ type: "rename", dataroom: room })}
                  >
                    <Pencil />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setDialog({ type: "delete", dataroom: room })}
                  >
                    <Trash2 className="text-destructive" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
      </main>

      <NameDialog
        open={dialog.type === "create"}
        onOpenChange={(open) => !open && closeDialog()}
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
        open={dialog.type === "rename"}
        onOpenChange={(open) => !open && closeDialog()}
        title="Rename dataroom"
        initialValue={dialog.type === "rename" ? dialog.dataroom.name : ""}
        submitLabel="Rename"
        onSubmit={async (name) => {
          if (dialog.type !== "rename") return;
          await renameDataroom(dialog.dataroom.id, name);
          toast.success("Renamed");
        }}
      />

      <DeleteConfirmDialog
        open={dialog.type === "delete"}
        onOpenChange={(open) => !open && closeDialog()}
        title={dialog.type === "delete" ? `Delete "${dialog.dataroom.name}"?` : "Delete?"}
        description="This permanently deletes the dataroom with all of its folders and files. This cannot be undone."
        onConfirm={async () => {
          if (dialog.type !== "delete") return;
          try {
            await deleteDataroom(dialog.dataroom.id);
            toast.success(`Deleted "${dialog.dataroom.name}"`);
          } catch (error) {
            toast.error("Couldn't delete dataroom", {
              description: error instanceof Error ? error.message : undefined,
            });
          }
        }}
      />
    </div>
  );
}
