export interface Dataroom {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  dataroomId: string;
  parentId: string | null;
  name: string;
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
  uploadedAt: string;
  updatedAt: string;
}

export interface TreeNode {
  folder: Folder;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

export type SortField = "name" | "uploadedAt" | "size";
export type SortDirection = "asc" | "desc";
export type ViewMode = "grid" | "list";
