import type { FileItem } from "@/types";

export interface TagEditorDialogProps {
  file: FileItem | null;
  onOpenChange: (open: boolean) => void;
}
