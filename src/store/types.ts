import type { Dataroom, FileItem, Folder, SortDirection, SortField, ViewMode } from "@/types";
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

export interface DataState {
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
  createDataroom: (name: string) => Promise<Dataroom>;
  renameDataroom: (dataroomId: string, name: string) => Promise<void>;
  deleteDataroom: (dataroomId: string) => Promise<void>;

  createFolder: (parentId: string | null, name: string) => Promise<Folder>;
  renameFolder: (folderId: string, name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<string[]>;
  moveFolder: (folderId: string, newParentId: string | null) => Promise<void>;

  uploadFiles: (parentId: string | null, files: File[]) => Promise<UploadResult>;
  renameFile: (fileId: string, name: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  moveFile: (fileId: string, newParentId: string | null) => Promise<void>;
}

export interface UiState {
  viewMode: ViewMode;
  sortField: SortField;
  sortDirection: SortDirection;
  expandedFolderIds: Record<string, true>;
  sidebarOpen: boolean;

  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  setSort: (field: SortField) => void;
  toggleFolderExpanded: (folderId: string) => void;
  expandFolders: (folderIds: string[]) => void;
  setSidebarOpen: (open: boolean) => void;
}
