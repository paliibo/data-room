import type { FileItem } from "@/types";

export interface PdfViewerProps {
  fileId: string;
  fileName: string;
  /** Text drawn diagonally across the document for watermarked share links. */
  watermark?: string | null;
  allowDownload?: boolean;
}

export type ViewerState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; url: string };

export interface PdfPreviewDialogProps {
  file: FileItem | null;
  onOpenChange: (open: boolean) => void;
  onEditTags?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  /** Read-only mode for the public share viewer. */
  readOnly?: boolean;
  watermark?: string | null;
  allowDownload?: boolean;
}

export interface MetadataRowProps {
  label: string;
  value: string;
}
