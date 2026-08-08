import type { Folder, ShareLink } from "@/types";

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Folder the link is scoped to; null shares the whole dataroom. */
  folderId: string | null;
  folder?: Folder | null;
  dataroomName: string;
}

export interface ShareLinkCardProps {
  link: ShareLink;
  folderName: string | null;
  onRevoke: (linkId: string) => void;
  onDelete: (linkId: string) => void;
}

export interface CopyFieldProps {
  value: string;
  label: string;
}

export const EXPIRY_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: null, label: "Never" },
] as const;
