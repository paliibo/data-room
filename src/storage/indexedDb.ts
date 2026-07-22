import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  ActivityEvent,
  ChecklistItem,
  Dataroom,
  FileItem,
  Folder,
  ShareLink,
  Tag,
} from "@/types";

export interface DataroomDB extends DBSchema {
  datarooms: {
    key: string;
    value: Dataroom;
  };
  folders: {
    key: string;
    value: Folder;
    indexes: { "by-dataroom": string };
  };
  files: {
    key: string;
    value: FileItem;
    indexes: { "by-dataroom": string };
  };
  blobs: {
    key: string;
    value: Blob;
  };
  tags: {
    key: string;
    value: Tag;
    indexes: { "by-dataroom": string };
  };
  shareLinks: {
    key: string;
    value: ShareLink;
    indexes: { "by-dataroom": string; "by-token": string };
  };
  activity: {
    key: string;
    value: ActivityEvent;
    indexes: { "by-dataroom": string };
  };
  checklist: {
    key: string;
    value: ChecklistItem;
    indexes: { "by-dataroom": string };
  };
}

const DB_NAME = "dataroom-mvp";
export const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<DataroomDB>> | null = null;

export class StorageError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "StorageError";
    this.cause = cause;
  }
}

/**
 * Creates every store the current schema needs. Written so each version step is
 * additive: a v1 database keeps its rows and only gains the new stores, and a
 * fresh database runs both steps in one upgrade transaction.
 */
export function migrate(db: IDBPDatabase<DataroomDB>, oldVersion: number) {
  if (oldVersion < 1) {
    db.createObjectStore("datarooms", { keyPath: "id" });
    db.createObjectStore("folders", { keyPath: "id" }).createIndex(
      "by-dataroom",
      "dataroomId",
    );
    db.createObjectStore("files", { keyPath: "id" }).createIndex(
      "by-dataroom",
      "dataroomId",
    );
    db.createObjectStore("blobs");
  }
  if (oldVersion < 2) {
    db.createObjectStore("tags", { keyPath: "id" }).createIndex(
      "by-dataroom",
      "dataroomId",
    );
    const shares = db.createObjectStore("shareLinks", { keyPath: "id" });
    shares.createIndex("by-dataroom", "dataroomId");
    shares.createIndex("by-token", "token", { unique: true });
    db.createObjectStore("activity", { keyPath: "id" }).createIndex(
      "by-dataroom",
      "dataroomId",
    );
    db.createObjectStore("checklist", { keyPath: "id" }).createIndex(
      "by-dataroom",
      "dataroomId",
    );
  }
}

export function getDb(): Promise<IDBPDatabase<DataroomDB>> {
  dbPromise ??= openDB<DataroomDB>(DB_NAME, DB_VERSION, {
    upgrade: migrate,
    blocked() {
      console.warn("IndexedDB open is blocked by another tab");
    },
  }).catch((error) => {
    dbPromise = null;
    throw new StorageError(
      "Could not open local storage. Your browser may be in private mode or out of disk space.",
      error,
    );
  });
  return dbPromise;
}

export async function withStorage<T>(
  operation: (db: IDBPDatabase<DataroomDB>) => Promise<T>,
  errorMessage: string,
): Promise<T> {
  const db = await getDb();
  try {
    return await operation(db);
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(errorMessage, error);
  }
}

export async function destroyDatabase(): Promise<void> {
  if (dbPromise) {
    (await dbPromise).close();
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

/** Test seam: drops the memoized connection so a fresh `getDb()` reopens. */
export function resetDbConnection() {
  dbPromise = null;
}

/** Best-effort browser storage quota, used by the sidebar usage meter. */
export async function estimateUsage(): Promise<{ used: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return quota > 0 ? { used: usage, quota } : null;
  } catch {
    return null;
  }
}
