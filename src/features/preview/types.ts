import type { FileItem } from "@/types";

export interface PdfViewerProps {
  fileId: string;
  fileName: string;
}

export type ViewerState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; url: string };

export interface PdfPreviewDialogProps {
  file: FileItem | null;
  onOpenChange: (open: boolean) => void;
}

export interface MetadataRowProps {
  label: string;
  value: string;
}
