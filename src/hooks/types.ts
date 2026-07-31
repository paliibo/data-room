import type { ActivityEvent, BrowseScope, FileItem, Folder } from "@/types";
import type { LoadStatus } from "@/store/types";

export interface Breadcrumb {
  id: string | null;
  name: string;
}

export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface ShortcutMap {
  [key: string]: ShortcutHandler;
}

export type Theme = "light" | "dark";

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export interface FolderContents {
  folders: Folder[];
  files: FileItem[];
  isEmpty: boolean;
  status: LoadStatus;
  /** Items hidden by the active tag filter, so the UI can offer to clear it. */
  filteredOut: number;
}

export interface DataroomStats {
  fileCount: number;
  folderCount: number;
  totalSize: number;
  activeShares: number;
}

export interface DayBucket {
  date: string;
  label: string;
  views: number;
  downloads: number;
  uploads: number;
}

export interface FileEngagement {
  fileId: string;
  name: string;
  views: number;
  downloads: number;
  lastViewedAt: string | null;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalDownloads: number;
  totalUploads: number;
  uniqueViewers: number;
  timeline: DayBucket[];
  topFiles: FileEngagement[];
  busiestDay: DayBucket | null;
  recentEvents: ActivityEvent[];
}

export interface StorageEstimate {
  used: number;
  quota: number;
  percent: number;
}

export interface UseFolderContentsOptions {
  scope: BrowseScope;
  folderId: string | null;
  searchQuery: string;
}
