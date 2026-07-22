import type { Dataroom, FileItem, Folder } from "@/types";
import { ACCENTS } from "@/lib/accent";

/**
 * Records written by schema v1 predate the starred/trash/tag fields. Rather than
 * rewriting every row during the upgrade transaction, rows are normalized as
 * they are read — old data keeps working and pays no migration cost up front.
 */

export function normalizeDataroom(raw: Dataroom): Dataroom {
  return {
    ...raw,
    description: raw.description ?? "",
    accent: ACCENTS.includes(raw.accent) ? raw.accent : "indigo",
  };
}

export function normalizeFolder(raw: Folder): Folder {
  return {
    ...raw,
    starred: raw.starred ?? false,
    deletedAt: raw.deletedAt ?? null,
  };
}

export function normalizeFile(raw: FileItem): FileItem {
  return {
    ...raw,
    starred: raw.starred ?? false,
    deletedAt: raw.deletedAt ?? null,
    tagIds: raw.tagIds ?? [],
    note: raw.note ?? "",
  };
}
