import { memo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Folder as FolderIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes, formatRelative } from "@/lib/format";
import { getDragPayload, isItemDrag, setDragPayload } from "@/lib/dnd";
import { Checkbox } from "@/components/ui/checkbox";
import { TagChip } from "@/components/shared/TagChip";
import { useFileTags } from "@/hooks/useTags";
import { ItemContextMenu } from "./ItemContextMenu";
import { itemId, itemName } from "@/features/browser/utils";
import type { ItemViewProps } from "@/features/browser/types";

export const ItemCard = memo(function ItemCard({
  item,
  actions,
  scope,
  isSelected,
  isSelecting,
  onSelect,
  onToggleSelect,
}: ItemViewProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const id = itemId(item);
  const name = itemName(item);
  const isFolder = item.kind === "folder";
  const starred = isFolder ? item.folder.starred : item.file.starred;
  const tags = useFileTags(isFolder ? [] : item.file.tagIds);

  const open = () =>
    isFolder ? actions.onOpenFolder(id) : actions.onPreviewFile(item.file);

  return (
    <ItemContextMenu item={item} actions={actions} scope={scope}>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        role="button"
        tabIndex={0}
        aria-label={`${isFolder ? "Folder" : "File"}: ${name}`}
        aria-selected={isSelected}
        className={cn(
          "group relative flex cursor-pointer select-none flex-col gap-3 rounded-xl border bg-card p-3.5 elevate-1 transition-all",
          "hover:border-brand/40 hover:elevate-2",
          isSelected && "border-brand bg-brand-soft/40 ring-1 ring-brand",
          isDropTarget && "border-brand bg-brand-soft ring-2 ring-brand",
        )}
        draggable={scope !== "trash"}
        onDragStart={(e) =>
          setDragPayload(e as unknown as React.DragEvent, { kind: item.kind, id })
        }
        onDragOver={(e) => {
          if (isFolder && scope !== "trash" && isItemDrag(e as unknown as React.DragEvent)) {
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
        onClick={(e) => onSelect(id, e as unknown as React.MouseEvent)}
        onDoubleClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter") open();
        }}
      >
        <div
          className={cn(
            "absolute left-2.5 top-2.5 z-10 transition-opacity",
            isSelecting || isSelected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          <Checkbox
            checked={isSelected}
            aria-label={`Select ${name}`}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={() => onToggleSelect(id)}
          />
        </div>

        {starred && (
          <Star
            className="absolute right-2.5 top-2.5 size-3.5 fill-warning text-warning"
            aria-label="Starred"
          />
        )}

        <div
          className={cn(
            "flex h-20 items-center justify-center rounded-lg",
            isFolder ? "bg-brand-soft/60" : "bg-muted",
          )}
        >
          {isFolder ? (
            <FolderIcon className="size-9 text-brand" aria-hidden />
          ) : (
            <FileText className="size-9 text-destructive/70" aria-hidden />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={name}>
            {name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular">
            {isFolder
              ? "Folder"
              : `${formatBytes(item.file.size)} · ${formatRelative(item.file.uploadedAt)}`}
          </p>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
              {tags.length > 2 && (
                <span className="text-[11px] text-muted-foreground">+{tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </ItemContextMenu>
  );
});
