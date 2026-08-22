import type { FileItem, Folder, ShareLink } from "@/types";

let counter = 0;
const nextId = () => `id-${++counter}`;

const NOW = "2026-01-15T10:00:00.000Z";

export function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: nextId(),
    dataroomId: "room-1",
    parentId: null,
    name: "Folder",
    starred: false,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeFile(overrides: Partial<FileItem> = {}): FileItem {
  return {
    id: nextId(),
    dataroomId: "room-1",
    parentId: null,
    name: "Document.pdf",
    originalFilename: "Document.pdf",
    size: 1024,
    mimeType: "application/pdf",
    starred: false,
    deletedAt: null,
    tagIds: [],
    note: "",
    uploadedAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeShareLink(overrides: Partial<ShareLink> = {}): ShareLink {
  return {
    id: nextId(),
    dataroomId: "room-1",
    token: "token-abc",
    label: "Test link",
    folderId: null,
    expiresAt: null,
    passcode: null,
    allowDownload: true,
    watermark: false,
    revokedAt: null,
    viewCount: 0,
    lastViewedAt: null,
    createdAt: NOW,
    ...overrides,
  };
}

/** A PDF-shaped File the upload validator will accept. */
export function makePdfFile(name = "Report.pdf", size = 2048): File {
  return new File([new Uint8Array(size)], name, { type: "application/pdf" });
}
