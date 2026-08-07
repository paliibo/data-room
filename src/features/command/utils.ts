import type { FileItem, Folder } from "@/types";
import type { SearchHit } from "@/features/command/types";

const MAX_HITS = 8;

/** Human-readable location for a hit, built by walking parent pointers. */
export function folderPath(
  foldersById: Record<string, Folder>,
  parentId: string | null,
  rootName: string,
): string {
  const parts: string[] = [];
  const visited = new Set<string>();
  let cursor = parentId;
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const folder = foldersById[cursor];
    if (!folder) break;
    parts.unshift(folder.name);
    cursor = folder.parentId;
  }
  return [rootName, ...parts].join(" / ");
}

/**
 * Searches the whole open dataroom, not just the current folder — the palette's
 * whole point is to reach something without navigating to it first.
 */
export function searchDataroom(
  query: string,
  foldersById: Record<string, Folder>,
  filesById: Record<string, FileItem>,
  rootName: string,
): SearchHit[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];

  const hits: SearchHit[] = [];
  const score = (name: string) => {
    const lower = name.toLocaleLowerCase();
    if (!lower.includes(needle)) return -1;
    // Prefix matches first, then earlier matches, then shorter names.
    return lower.startsWith(needle) ? 0 : lower.indexOf(needle) + 1;
  };

  const ranked: { hit: SearchHit; score: number }[] = [];

  for (const folder of Object.values(foldersById)) {
    if (folder.deletedAt) continue;
    const s = score(folder.name);
    if (s < 0) continue;
    ranked.push({
      hit: { kind: "folder", folder, path: folderPath(foldersById, folder.parentId, rootName) },
      score: s,
    });
  }
  for (const file of Object.values(filesById)) {
    if (file.deletedAt) continue;
    const s = score(file.name);
    if (s < 0) continue;
    ranked.push({
      hit: { kind: "file", file, path: folderPath(foldersById, file.parentId, rootName) },
      score: s,
    });
  }

  ranked.sort((a, b) => a.score - b.score || a.hit.path.localeCompare(b.hit.path));
  for (const { hit } of ranked.slice(0, MAX_HITS)) hits.push(hit);
  return hits;
}
