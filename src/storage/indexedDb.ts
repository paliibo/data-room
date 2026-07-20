import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Dataroom, FileItem, Folder } from "@/types";

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
}

const DB_NAME = "dataroom-mvp";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DataroomDB>> | null = null;

export class StorageError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "StorageError";
    this.cause = cause;
  }
}

export function getDb(): Promise<IDBPDatabase<DataroomDB>> {
  dbPromise ??= openDB<DataroomDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore("datarooms", { keyPath: "id" });
      const folders = db.createObjectStore("folders", { keyPath: "id" });
      folders.createIndex("by-dataroom", "dataroomId");
      const files = db.createObjectStore("files", { keyPath: "id" });
      files.createIndex("by-dataroom", "dataroomId");
      db.createObjectStore("blobs");
    },
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
