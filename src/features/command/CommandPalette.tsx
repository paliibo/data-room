import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Clock,
  FileText,
  Files,
  FolderPlus,
  Folder as FolderIcon,
  Keyboard,
  Link2,
  ListChecks,
  Moon,
  PieChart,
  Star,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useDataStore } from "@/store/dataStore";
import { useTheme } from "@/hooks/useTheme";
import { searchDataroom } from "@/features/command/utils";
import type { CommandAction, CommandPaletteProps } from "@/features/command/types";

/**
 * One surface for "get me somewhere" and "do a thing". Searching spans the whole
 * dataroom rather than the open folder, since reaching a document without
 * navigating to it is the reason to open this at all.
 */
export function CommandPalette({
  open,
  onOpenChange,
  dataroomId,
  onPreviewFile,
  onNewFolder,
  onUpload,
  onShare,
  onShowShortcuts,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { theme, toggleTheme } = useTheme();

  const { foldersById, filesById, roomName } = useDataStore(
    useShallow((s) => ({
      foldersById: s.foldersById,
      filesById: s.filesById,
      roomName: s.activeDataroomId
        ? s.dataroomsById[s.activeDataroomId]?.name ?? "Dataroom"
        : "Dataroom",
    })),
  );

  const hits = useMemo(
    () => searchDataroom(query, foldersById, filesById, roomName),
    [query, foldersById, filesById, roomName],
  );

  const close = () => {
    onOpenChange(false);
    setQuery("");
  };

  const run = (action: () => void) => () => {
    close();
    // Let the dialog's close animation start before the next surface opens.
    requestAnimationFrame(action);
  };

  const base = `/d/${dataroomId}`;

  const navigation: CommandAction[] = [
    { id: "nav-files", label: "All files", icon: Files, run: () => navigate(base) },
    { id: "nav-starred", label: "Starred", icon: Star, run: () => navigate(`${base}/starred`) },
    { id: "nav-recent", label: "Recent", icon: Clock, run: () => navigate(`${base}/recent`) },
    { id: "nav-trash", label: "Trash", icon: Trash2, run: () => navigate(`${base}/trash`) },
    {
      id: "nav-checklist",
      label: "Due-diligence checklist",
      icon: ListChecks,
      run: () => navigate(`${base}/checklist`),
    },
    { id: "nav-shares", label: "Share links", icon: Link2, run: () => navigate(`${base}/shares`) },
    { id: "nav-activity", label: "Activity log", icon: Activity, run: () => navigate(`${base}/activity`) },
    { id: "nav-analytics", label: "Analytics", icon: PieChart, run: () => navigate(`${base}/analytics`) },
  ];

  const actions: CommandAction[] = [
    { id: "act-upload", label: "Upload PDFs", shortcut: "U", icon: Upload, run: onUpload },
    { id: "act-folder", label: "New folder", shortcut: "N", icon: FolderPlus, run: onNewFolder },
    { id: "act-share", label: "Create share link", icon: Link2, run: onShare },
    {
      id: "act-theme",
      label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      icon: theme === "dark" ? Sun : Moon,
      run: toggleTheme,
    },
    { id: "act-shortcuts", label: "Keyboard shortcuts", shortcut: "?", icon: Keyboard, run: onShowShortcuts },
  ];

  return (
    <CommandDialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search documents, or jump to a view…"
      />
      <CommandList>
        <CommandEmpty>No matches in {roomName}.</CommandEmpty>

        {hits.length > 0 && (
          <>
            <CommandGroup heading="Documents">
              {hits.map((hit) => {
                const id = hit.kind === "folder" ? hit.folder!.id : hit.file!.id;
                const name = hit.kind === "folder" ? hit.folder!.name : hit.file!.name;
                return (
                  <CommandItem
                    key={id}
                    value={`${name} ${hit.path} ${id}`}
                    onSelect={run(() =>
                      hit.kind === "folder"
                        ? navigate(`${base}/f/${id}`)
                        : onPreviewFile(hit.file!),
                    )}
                  >
                    {hit.kind === "folder" ? <FolderIcon /> : <FileText />}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{name}</span>
                      <span className="truncate text-xs text-muted-foreground">{hit.path}</span>
                    </span>
                    <CommandShortcut>
                      {hit.kind === "folder" ? "Open" : "Preview"}
                    </CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Actions">
          {actions.map((action) => (
            <CommandItem key={action.id} value={action.label} onSelect={run(action.run)}>
              <action.icon />
              {action.label}
              {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Go to">
          {navigation.map((item) => (
            <CommandItem key={item.id} value={item.label} onSelect={run(item.run)}>
              <item.icon />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
