import { memo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Folder as FolderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes, formatRelative } from "@/lib/format";
import { getDragPayload, isItemDrag, setDragPayload } from "@/lib/dnd";
import { ItemContextMenu } from "./ItemContextMenu";
import { itemId, itemName } from "@/features/browser/utils";
import type { ItemCardProps } from "@/features/browser/types";

export const ItemCard = memo(function ItemCard({
  item,
  actions,
  isSelected,
  onSelect,
}: ItemCardProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const id = itemId(item);
  const name = itemName(item);
  const isFolder = item.kind === "folder";

  const open = () =>
    isFolder ? actions.onOpenFolder(id) : actions.onPreviewFile(item.file);

  return (
    <ItemContextMenu item={item} actions={actions}>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        role="button"
        tabIndex={0}
        aria-label={`${isFolder ? "Folder" : "File"}: ${name}`}
        className={cn(
          "group flex cursor-pointer select-none flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors",
          "hover:border-brand/40 hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isSelected && "border-brand ring-1 ring-brand",
          isDropTarget && "border-brand bg-brand/10 ring-2 ring-brand",
        )}
        draggable
        onDragStart={(e) =>
          setDragPayload(e as unknown as React.DragEvent, { kind: item.kind, id })
        }
        onDragOver={(e) => {
          if (isFolder && isItemDrag(e as unknown as React.DragEvent)) {
            e.preventDefault();
            setIsDropTarget(true);
          }
        }}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={(e) => {
          setIsDropTarget(false);
          if (!isFolder) return;
          const payload = getDragPayload(e as unknown as React.DragEvent);
          if (payload && payload.id !== id) {
            e.preventDefault();
            e.stopPropagation();
            actions.onMoveItem(payload, id);
          }
        }}
        onClick={() => onSelect(id)}
        onDoubleClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter") open();
        }}
      >
        <div
          className={cn(
            "flex h-20 items-center justify-center rounded-lg",
            isFolder ? "bg-brand/10" : "bg-muted",
          )}
        >
          {isFolder ? (
            <FolderIcon className="h-9 w-9 text-brand" aria-hidden />
          ) : (
            <FileText className="h-9 w-9 text-red-500/80" aria-hidden />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={name}>
            {name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isFolder
              ? "Folder"
              : `${formatBytes(item.file.size)} · ${formatRelative(item.file.uploadedAt)}`}
          </p>
        </div>
      </motion.div>
    </ItemContextMenu>
  );
});
