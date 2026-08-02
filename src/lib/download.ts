import JSZip from "jszip";
import type { FileItem, Folder } from "@/types";
import { FileRepository } from "@/storage/repositories/FileRepository";

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

export async function downloadFile(fileId: string, fileName: string): Promise<void> {
  const blob = await FileRepository.getBlob(fileId);
  if (!blob) {
    throw new Error("The file content could not be found in local storage.");
  }
  triggerDownload(blob, fileName);
}

export interface ZipEntry {
  file: FileItem;
  /** Slash-separated path inside the archive, excluding the file name. */
  path: string;
}

/**
 * Bundles a selection into a zip, rebuilding the folder structure inside the
 * archive so a downloaded subtree still makes sense on disk. Missing blobs are
 * skipped rather than failing the whole export.
 */
export async function downloadZip(
  entries: ZipEntry[],
  archiveName: string,
): Promise<number> {
  if (entries.length === 0) return 0;
  const zip = new JSZip();
  let added = 0;

  for (const { file, path } of entries) {
    const blob = await FileRepository.getBlob(file.id);
    if (!blob) continue;
    zip.file(path ? `${path}/${file.name}` : file.name, blob);
    added++;
  }
  if (added === 0) {
    throw new Error("None of the selected files had content in local storage.");
  }

  const archive = await zip.generateAsync({ type: "blob", compression: "STORE" });
  triggerDownload(archive, archiveName.endsWith(".zip") ? archiveName : `${archiveName}.zip`);
  return added;
}

/** Builds archive-relative paths for a subtree rooted at `folder`. */
export function collectZipEntries(
  folder: Folder | null,
  foldersById: Record<string, Folder>,
  filesById: Record<string, FileItem>,
  childrenByParent: Record<string, { folderIds: string[]; fileIds: string[] }>,
  rootKey: string,
): ZipEntry[] {
  const entries: ZipEntry[] = [];
  const walk = (key: string, path: string) => {
    const children = childrenByParent[key];
    if (!children) return;
    for (const fileId of children.fileIds) {
      const file = filesById[fileId];
      if (file && !file.deletedAt) entries.push({ file, path });
    }
    for (const folderId of children.folderIds) {
      const child = foldersById[folderId];
      if (!child || child.deletedAt) continue;
      walk(folderId, path ? `${path}/${child.name}` : child.name);
    }
  };
  walk(folder ? folder.id : rootKey, "");
  return entries;
}

/** Exports a dataroom's structure as JSON — a lightweight, portable manifest. */
export function downloadManifest(name: string, manifest: unknown): void {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, `${name.replace(/[^\w.-]+/g, "-").toLowerCase()}-manifest.json`);
}
