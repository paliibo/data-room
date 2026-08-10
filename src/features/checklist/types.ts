import type { ChecklistItem, ChecklistStatus, FileItem } from "@/types";

export interface ChecklistRowProps {
  item: ChecklistItem;
  files: FileItem[];
  onStatusChange: (itemId: string, status: ChecklistStatus) => void;
  onAttach: (item: ChecklistItem) => void;
  onDelete: (itemId: string) => void;
  onOpenFile: (file: FileItem) => void;
}

export interface AttachFilesDialogProps {
  item: ChecklistItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (itemId: string, fileIds: string[]) => Promise<void>;
}

export const STATUS_META: Record<
  ChecklistStatus,
  { label: string; badge: "outline" | "warning" | "success" }
> = {
  requested: { label: "Requested", badge: "outline" },
  "in-review": { label: "In review", badge: "warning" },
  complete: { label: "Complete", badge: "success" },
};

/** A conventional first-round diligence request list, offered as a starting point. */
export const STARTER_REQUESTS: { title: string; category: string }[] = [
  { title: "Certificate of incorporation", category: "Corporate" },
  { title: "Cap table and option ledger", category: "Corporate" },
  { title: "Board minutes (last 24 months)", category: "Corporate" },
  { title: "Audited financial statements", category: "Financial" },
  { title: "Monthly management accounts", category: "Financial" },
  { title: "Revenue by customer cohort", category: "Financial" },
  { title: "Top 20 customer contracts", category: "Commercial" },
  { title: "Supplier and reseller agreements", category: "Commercial" },
  { title: "Employment agreements for key staff", category: "People" },
  { title: "Employee equity plan documents", category: "People" },
  { title: "Registered IP and trademarks", category: "Legal & IP" },
  { title: "Open source license inventory", category: "Legal & IP" },
  { title: "Data processing agreements", category: "Legal & IP" },
  { title: "Pending or threatened litigation", category: "Legal & IP" },
];
