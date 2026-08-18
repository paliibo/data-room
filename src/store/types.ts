import type {
  AccentColor,
  ActivityEvent,
  ActivityType,
  BrowseScope,
  ChecklistItem,
  Dataroom,
  FileItem,
  Folder,
  ShareLink,
  SortDirection,
  SortField,
  Tag,
  ViewMode,
} from "@/types";
import type { UploadRejection } from "@/lib/validation";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export interface ChildIds {
  folderIds: string[];
  fileIds: string[];
}

export interface UploadResult {
  uploaded: FileItem[];
  rejected: UploadRejection[];
}

/** What was removed from the tree, so the caller can offer a precise undo. */
export interface TrashResult {
  folderIds: string[];
  fileIds: string[];
}

export interface ActivityDraft {
  type: ActivityType;
  targetId?: string | null;
  targetName: string;
  detail?: string;
  actor?: string;
  /** Explicit timestamp. Only the demo seeder sets this; actions use now(). */
  at?: string;
}

export interface ShareLinkDraft {
  label: string;
  folderId: string | null;
  expiresInDays: number | null;
  passcode: string | null;
  allowDownload: boolean;
  watermark: boolean;
}

/** The tree of datarooms, folders and files, plus everything that mutates it. */
export interface CoreSlice {
  dataroomsStatus: LoadStatus;
  contentStatus: LoadStatus;
  storageError: string | null;

  dataroomsById: Record<string, Dataroom>;
  dataroomIds: string[];

  activeDataroomId: string | null;
  foldersById: Record<string, Folder>;
  filesById: Record<string, FileItem>;
  childrenByParent: Record<string, ChildIds>;

  loadDatarooms: () => Promise<void>;
  openDataroom: (dataroomId: string) => Promise<void>;
  createDataroom: (name: string, description?: string, accent?: AccentColor) => Promise<Dataroom>;
  renameDataroom: (dataroomId: string, name: string) => Promise<void>;
  updateDataroom: (
    dataroomId: string,
    patch: Partial<Pick<Dataroom, "name" | "description" | "accent">>,
  ) => Promise<void>;
  deleteDataroom: (dataroomId: string) => Promise<void>;

  createFolder: (parentId: string | null, name: string) => Promise<Folder>;
  renameFolder: (folderId: string, name: string) => Promise<void>;
  moveFolder: (folderId: string, newParentId: string | null) => Promise<void>;

  uploadFiles: (parentId: string | null, files: File[]) => Promise<UploadResult>;
  renameFile: (fileId: string, name: string) => Promise<void>;
  moveFile: (fileId: string, newParentId: string | null) => Promise<void>;
  updateFileNote: (fileId: string, note: string) => Promise<void>;
  toggleStar: (kind: "folder" | "file", id: string) => Promise<void>;
}

/** Soft delete: items keep their place in the tree until purged. */
export interface TrashSlice {
  trashFolder: (folderId: string) => Promise<TrashResult>;
  trashFile: (fileId: string) => Promise<TrashResult>;
  trashMany: (folderIds: string[], fileIds: string[]) => Promise<TrashResult>;
  restore: (result: TrashResult) => Promise<void>;
  purgeFolder: (folderId: string) => Promise<void>;
  purgeFile: (fileId: string) => Promise<void>;
  emptyTrash: () => Promise<number>;
}

export interface TagSlice {
  tagsById: Record<string, Tag>;
  tagIds: string[];
  createTag: (name: string, color: AccentColor) => Promise<Tag>;
  renameTag: (tagId: string, name: string) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;
  setFileTags: (fileId: string, tagIds: string[]) => Promise<void>;
}

export interface ShareSlice {
  sharesById: Record<string, ShareLink>;
  shareIds: string[];
  createShareLink: (draft: ShareLinkDraft) => Promise<ShareLink>;
  revokeShareLink: (linkId: string) => Promise<void>;
  deleteShareLink: (linkId: string) => Promise<void>;
  registerShareView: (token: string) => Promise<void>;
}

export interface ActivitySlice {
  activity: ActivityEvent[];
  logActivity: (draft: ActivityDraft | ActivityDraft[]) => Promise<void>;
  clearActivity: () => Promise<void>;
}

export interface ChecklistSlice {
  checklistById: Record<string, ChecklistItem>;
  checklistIds: string[];
  createChecklistItem: (title: string, category: string) => Promise<ChecklistItem>;
  updateChecklistItem: (
    itemId: string,
    patch: Partial<Pick<ChecklistItem, "title" | "category" | "status" | "fileIds">>,
  ) => Promise<void>;
  deleteChecklistItem: (itemId: string) => Promise<void>;
  seedChecklist: (titles: { title: string; category: string }[]) => Promise<void>;
}

export type DataState = CoreSlice &
  TrashSlice &
  TagSlice &
  ShareSlice &
  ActivitySlice &
  ChecklistSlice;

export interface UiState {
  viewMode: ViewMode;
  sortField: SortField;
  sortDirection: SortDirection;
  expandedFolderIds: Record<string, true>;
  sidebarOpen: boolean;
  density: "comfortable" | "compact";
  /** Tag ids the content view is filtered down to. */
  tagFilter: string[];

  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  setSort: (field: SortField) => void;
  toggleFolderExpanded: (folderId: string) => void;
  expandFolders: (folderIds: string[]) => void;
  collapseAll: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDensity: () => void;
  toggleTagFilter: (tagId: string) => void;
  clearTagFilter: () => void;
}

export interface SelectionState {
  scope: BrowseScope;
  selectedIds: string[];
  setScope: (scope: BrowseScope) => void;
  select: (id: string | null) => void;
  toggle: (id: string) => void;
  selectRange: (ids: string[]) => void;
  clear: () => void;
}
