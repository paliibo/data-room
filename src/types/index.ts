export interface Dataroom {
  id: string;
  name: string;
  /** Short deal description shown on the dataroom card. */
  description: string;
  /** Tailwind-free accent token used to tint the room's icon and charts. */
  accent: AccentColor;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  dataroomId: string;
  parentId: string | null;
  name: string;
  starred: boolean;
  /** ISO timestamp when moved to trash, or null when live. */
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  dataroomId: string;
  parentId: string | null;
  name: string;
  originalFilename: string;
  size: number;
  mimeType: string;
  starred: boolean;
  deletedAt: string | null;
  tagIds: string[];
  /** Free-form reviewer note surfaced in the preview panel. */
  note: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  dataroomId: string;
  name: string;
  color: AccentColor;
  createdAt: string;
}

/** A revocable, policy-bearing link to a folder or the whole dataroom. */
export interface ShareLink {
  id: string;
  dataroomId: string;
  token: string;
  label: string;
  /** null targets the dataroom root — the whole room. */
  folderId: string | null;
  /** null never expires. */
  expiresAt: string | null;
  /** null means no passcode gate. */
  passcode: string | null;
  allowDownload: boolean;
  watermark: boolean;
  revokedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
}

export type ActivityType =
  | "dataroom.create"
  | "dataroom.rename"
  | "folder.create"
  | "folder.rename"
  | "folder.move"
  | "folder.trash"
  | "folder.restore"
  | "file.upload"
  | "file.rename"
  | "file.move"
  | "file.trash"
  | "file.restore"
  | "file.delete"
  | "file.view"
  | "file.download"
  | "file.tag"
  | "file.star"
  | "share.create"
  | "share.revoke"
  | "share.view"
  | "checklist.create"
  | "checklist.status";

export interface ActivityEvent {
  id: string;
  dataroomId: string;
  type: ActivityType;
  /** Display name of who acted — "You" for local actions, or a share label. */
  actor: string;
  targetId: string | null;
  targetName: string;
  /** Extra human-readable context, e.g. "moved to Financials". */
  detail: string;
  at: string;
}

export type ChecklistStatus = "requested" | "in-review" | "complete";

export interface ChecklistItem {
  id: string;
  dataroomId: string;
  title: string;
  category: string;
  status: ChecklistStatus;
  fileIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TreeNode {
  folder: Folder;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

export type AccentColor =
  | "indigo"
  | "violet"
  | "sky"
  | "emerald"
  | "amber"
  | "rose";

export type SortField = "name" | "uploadedAt" | "size";
export type SortDirection = "asc" | "desc";
export type ViewMode = "grid" | "list";

/** Which slice of a dataroom the browser is showing. */
export type BrowseScope = "folder" | "starred" | "recent" | "trash";
