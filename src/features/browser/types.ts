import type { ReactNode, RefObject } from "react";
import type {
  BrowseScope,
  Dataroom,
  FileItem,
  Folder,
  Tag,
  TreeNode,
} from "@/types";
import type { DragPayload } from "@/lib/dnd";
import type { LoadStatus } from "@/store/types";

export type BrowserItem =
  | { kind: "folder"; folder: Folder }
  | { kind: "file"; file: FileItem };

/** Everything a card, row or context menu can ask the page to do. */
export interface ItemActions {
  onOpenFolder: (folderId: string) => void;
  onPreviewFile: (file: FileItem) => void;
  onRename: (item: BrowserItem) => void;
  onTrash: (item: BrowserItem) => void;
  onRestore: (item: BrowserItem) => void;
  onPurge: (item: BrowserItem) => void;
  onDownload: (file: FileItem) => void;
  onDownloadFolder: (folder: Folder) => void;
  onMoveItem: (payload: DragPayload, targetFolderId: string | null) => void;
  onToggleStar: (item: BrowserItem) => void;
  onEditTags: (file: FileItem) => void;
  onShare: (folderId: string | null) => void;
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
  isFolderScope: boolean;
  onNavigate: (folderId: string | null) => void;
  onMoveItem: (payload: DragPayload, targetFolderId: string | null) => void;
}

export interface SidebarProps {
  dataroom: Dataroom;
  activeFolderId: string | null;
  scope: BrowseScope;
  onNavigate: (folderId: string | null) => void;
  onMoveItem: (payload: DragPayload, targetFolderId: string | null) => void;
  onCreateDataroom: () => void;
  onOpenCommandPalette: () => void;
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
  onShare: () => void;
  scope: BrowseScope;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export interface TagFilterMenuProps {
  tags: Tag[];
  counts: Record<string, number>;
}

export interface ItemContextMenuProps {
  item: BrowserItem;
  actions: ItemActions;
  scope: BrowseScope;
  children: ReactNode;
}

export interface ItemViewProps {
  item: BrowserItem;
  actions: ItemActions;
  scope: BrowseScope;
  isSelected: boolean;
  /** True while any multi-selection is active — reveals the checkboxes. */
  isSelecting: boolean;
  onSelect: (id: string, event: React.MouseEvent | React.KeyboardEvent) => void;
  onToggleSelect: (id: string) => void;
}

export interface ContentViewProps {
  folders: Folder[];
  files: FileItem[];
  status: LoadStatus;
  scope: BrowseScope;
  searchQuery: string;
  selectedIds: string[];
  actions: ItemActions;
  onSelect: (id: string, event: React.MouseEvent | React.KeyboardEvent) => void;
  onToggleSelect: (id: string) => void;
  onUpload: () => void;
  onNewFolder: () => void;
  onClearSearch: () => void;
}

export interface LoadingSkeletonProps {
  viewMode: "grid" | "list";
}

export interface UploadDropzoneProps {
  onFiles: (files: File[]) => void;
  onOpenRef?: (open: () => void) => void;
  disabled?: boolean;
  children: ReactNode;
}

export interface BulkActionBarProps {
  count: number;
  scope: BrowseScope;
  onClear: () => void;
  onDownload: () => void;
  onStar: () => void;
  onTrash: () => void;
  onRestore: () => void;
}

export interface StorageMeterProps {
  fileCount: number;
  totalSize: number;
}
