import type { FileItem, Folder } from "@/types";

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataroomId: string;
  onPreviewFile: (file: FileItem) => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onShare: () => void;
  onShowShortcuts: () => void;
}

export interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

export interface SearchHit {
  kind: "folder" | "file";
  folder?: Folder;
  file?: FileItem;
  /** Breadcrumb-style path shown under the name, e.g. "Financials / 2024". */
  path: string;
}
