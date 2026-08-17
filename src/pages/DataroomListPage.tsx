import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Files,
  Loader2,
  Lock,
  MoreHorizontal,
  Moon,
  Pencil,
  PieChart,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { seedDemoDataroom } from "@/features/demo";
import { formatRelative } from "@/lib/format";
import { accentVars } from "@/lib/accent";
import type { DataroomListDialogState } from "@/pages/types";

const HIGHLIGHTS = [
  {
    icon: Files,
    title: "Organize",
    body: "Nested folders, tags, starring and drag-and-drop over a normalized local store.",
  },
  {
    icon: ShieldCheck,
    title: "Control",
    body: "Share links that expire, sit behind a passcode, block downloads or watermark previews.",
  },
  {
    icon: PieChart,
    title: "Prove",
    body: "Every action lands in an audit log that feeds a real engagement dashboard.",
  },
];

export default function DataroomListPage() {
  const navigate = useNavigate();
  const { status, storageError, datarooms, createDataroom, renameDataroom, deleteDataroom } =
    useDatarooms();
  const { theme, toggleTheme } = useTheme();
  const [dialog, setDialog] = useState<DataroomListDialogState>({ type: "closed" });
  const [isSeeding, setIsSeeding] = useState(false);

  const closeDialog = () => setDialog({ type: "closed" });

  const loadDemo = async () => {
    setIsSeeding(true);
    try {
      const room = await seedDemoDataroom();
      toast.success("Example dataroom ready");
      navigate(`/d/${room.id}`);
    } catch (error) {
      toast.error("Couldn't build the example", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <Lock className="size-4" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Vault</p>
              <p className="text-[11px] text-muted-foreground">Virtual data room</p>
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
            <Button variant="brand" size="sm" onClick={() => setDialog({ type: "create" })}>
              <Plus aria-hidden />
              New dataroom
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b">
        <div className="brand-glow absolute inset-0" aria-hidden />
        <div className="grid-backdrop absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <Badge variant="outline" className="mb-5 bg-card">
            <ShieldCheck aria-hidden />
            Runs entirely in your browser
          </Badge>
          <h1 className="max-w-2xl text-4xl leading-[1.08] sm:text-5xl">
            <span style={{ fontFamily: "var(--font-display)" }}>Due diligence</span>
            <br />
            <span className="font-semibold tracking-tight">without the back-and-forth.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Vault is a virtual data room: organize deal documents into folders,
            hand out links that expire, and see exactly which documents got read.
            Files, blobs and audit history all live in IndexedDB — there is no
            backend and nothing leaves this device.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button variant="brand" size="lg" onClick={() => setDialog({ type: "create" })}>
              <Plus aria-hidden />
              Create a dataroom
            </Button>
            <Button variant="outline" size="lg" onClick={loadDemo} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
              Load the example deal
            </Button>
          </div>

          <ul className="mt-12 grid gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map((highlight) => (
              <li
                key={highlight.title}
                className="rounded-xl border bg-card/80 p-4 backdrop-blur-sm elevate-1"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <highlight.icon className="size-4" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-semibold">{highlight.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {highlight.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Your datarooms</h2>
          {datarooms.length > 0 && (
            <Button variant="ghost" size="sm" onClick={loadDemo} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
              Add example
            </Button>
          )}
        </div>

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
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label="Loading datarooms"
          >
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : datarooms.length === 0 ? (
          <EmptyState
            icon={Files}
            title="No datarooms yet"
            description="Create an empty room, or load the example deal to see every feature with realistic documents already in place."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="brand" onClick={() => setDialog({ type: "create" })}>
                  <Plus aria-hidden />
                  Create dataroom
                </Button>
                <Button variant="outline" onClick={loadDemo} disabled={isSeeding}>
                  {isSeeding ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
                  Load the example
                </Button>
              </div>
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
                    style={accentVars(room.accent)}
                    className="group flex cursor-pointer flex-col justify-between gap-5 rounded-xl border bg-card p-5 elevate-1 transition-all hover:-translate-y-0.5 hover:border-tint/40 hover:elevate-2"
                    onClick={() => navigate(`/d/${room.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/d/${room.id}`);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-tint-soft">
                        <Files className="size-5 text-tint" aria-hidden />
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
                      {room.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {room.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Updated {formatRelative(room.updatedAt)}
                      </p>
                    </div>
                  </motion.div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => navigate(`/d/${room.id}`)}>Open</ContextMenuItem>
                  <ContextMenuItem onSelect={() => setDialog({ type: "rename", dataroom: room })}>
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

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-muted-foreground">
          <p>Everything is stored locally in IndexedDB. Nothing is uploaded.</p>
          <a
            href="https://github.com/paliibo/data-room"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Source on GitHub
          </a>
        </div>
      </footer>

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
        description="This permanently deletes the dataroom with all of its folders, files, share links and history. This cannot be undone."
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
