import type { Dataroom } from "@/types";
import type { BrowserItem } from "@/features/browser/types";

export type BrowserDialogState =
  | { type: "closed" }
  | { type: "create-folder" }
  | { type: "create-dataroom" }
  | { type: "rename-item"; item: BrowserItem }
  | { type: "delete-item"; item: BrowserItem };

export type DataroomListDialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "rename"; dataroom: Dataroom }
  | { type: "delete"; dataroom: Dataroom };
