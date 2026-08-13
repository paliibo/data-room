import type { RefObject } from "react";
import type { BrowseScope, Dataroom, FileItem, Folder } from "@/types";
import type { BrowserItem } from "@/features/browser/types";

export type BrowserDialogState =
  | { type: "closed" }
  | { type: "create-folder" }
  | { type: "create-dataroom" }
  | { type: "rename-item"; item: BrowserItem }
  | { type: "purge-item"; item: BrowserItem }
  | { type: "empty-trash" };

export type DataroomListDialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "rename"; dataroom: Dataroom }
  | { type: "delete"; dataroom: Dataroom };

/**
 * Passed down through the router outlet. The layout owns every dialog and the
 * file picker, so child views ask for them instead of duplicating the wiring.
 */
export interface DataroomOutletContext {
  dataroom: Dataroom;
  folderId: string | null;
  currentFolder: Folder | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  previewFile: (file: FileItem) => void;
  openShareDialog: (folderId: string | null) => void;
  openNewFolderDialog: () => void;
  openFilePicker: () => void;
  openTagEditor: (file: FileItem) => void;
  openRenameDialog: (item: BrowserItem) => void;
  openPurgeDialog: (item: BrowserItem) => void;
  openEmptyTrashDialog: () => void;
  navigateToFolder: (folderId: string | null) => void;
  isUploading: boolean;
  upload: (files: File[]) => void;
}

export interface BrowserViewProps {
  scope: BrowseScope;
}
