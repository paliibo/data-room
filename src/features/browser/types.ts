import type { ReactNode } from "react";
import type { Dataroom, FileItem, Folder, TreeNode } from "@/types";
import type { DragPayload } from "@/lib/dnd";
import type { LoadStatus } from "@/store/types";

export type BrowserItem =
  | { kind: "folder"; folder: Folder }
  | { kind: "file"; file: FileItem };

export interface ItemActions {
  onOpenFolder: (folderId: string) => void;
  onPreviewFile: (file: FileItem) => void;
  onRename: (item: BrowserItem) => void;
  onDelete: (item: BrowserItem) => void;
  onDownload: (file: FileItem) => void;
  onMoveItem: (payload: DragPayload, targetFolderId: string | null) => void;
}

export interface FolderNodeProps {
  node: TreeNode;
  isActive: boolean;
  onNavigate: (folderId: string) => void;
  onToggle: (folderId: string) => void;
  onDropItem: (payload: DragPayload, targetFolderId: string) => void;
}

export interface FolderTreeProps {
  activeFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
  onMoveItem: (payload: DragPayload, targetFolderId: string | null) => void;
}

export interface SidebarProps {
  dataroom: Dataroom;
  activeFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
  onMoveItem: (payload: DragPayload, targetFolderId: string | null) => void;
  onCreateDataroom: () => void;
}

export interface BreadcrumbsProps {
  folderId: string | null;
  onNavigate: (folderId: string | null) => void;
  onMoveItem: (payload: DragPayload, targetFolderId: string | null) => void;
}

export interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewFolder: () => void;
  onUpload: () => void;
}

export interface ShortcutHintProps {
  label: string;
  keys: string;
}

export interface ItemContextMenuProps {
  item: BrowserItem;
  actions: ItemActions;
  children: ReactNode;
}

export interface ItemCardProps {
  item: BrowserItem;
  actions: ItemActions;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export interface ItemRowProps {
  item: BrowserItem;
  actions: ItemActions;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export interface ContentViewProps {
  folders: Folder[];
  files: FileItem[];
  status: LoadStatus;
  searchQuery: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  actions: ItemActions;
  onUpload: () => void;
  onNewFolder: () => void;
}

export interface LoadingSkeletonProps {
  viewMode: "grid" | "list";
}

export interface UploadDropzoneProps {
  onFiles: (files: File[]) => void;
  onOpenRef?: (open: () => void) => void;
  children: ReactNode;
}
