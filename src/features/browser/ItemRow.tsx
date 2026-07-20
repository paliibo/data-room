import { memo, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes, formatDateTime } from "@/lib/format";
import { getDragPayload, isItemDrag, setDragPayload } from "@/lib/dnd";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ItemContextMenu } from "./ItemContextMenu";
import { itemId, itemName } from "@/features/browser/utils";
import type { ItemRowProps } from "@/features/browser/types";

export const ItemRow = memo(function ItemRow({
  item,
  actions,
  isSelected,
  onSelect,
}: ItemRowProps) {
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        role="button"
        tabIndex={0}
        aria-label={`${isFolder ? "Folder" : "File"}: ${name}`}
        className={cn(
          "group grid cursor-pointer select-none grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-transparent px-3 py-2 transition-colors sm:grid-cols-[minmax(0,1fr)_7rem_11rem_2.5rem]",
          "hover:bg-accent/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isSelected && "border-brand bg-brand/5",
          isDropTarget && "border-brand bg-brand/10",
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
        <div className="flex min-w-0 items-center gap-3">
          {isFolder ? (
            <FolderIcon className="h-5 w-5 shrink-0 text-brand" aria-hidden />
          ) : (
            <FileText className="h-5 w-5 shrink-0 text-red-500/80" aria-hidden />
          )}
          <span className="truncate text-sm font-medium" title={name}>
            {name}
          </span>
        </div>
        <span className="hidden text-right text-xs text-muted-foreground sm:block">
          {isFolder ? "—" : formatBytes(item.file.size)}
        </span>
        <span className="hidden text-right text-xs text-muted-foreground sm:block">
          {isFolder
            ? formatDateTime(item.folder.createdAt)
            : formatDateTime(item.file.uploadedAt)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${name}`}
              className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isFolder ? (
              <DropdownMenuItem onSelect={() => actions.onOpenFolder(id)}>
                <FolderOpen />
                Open
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onSelect={() => actions.onPreviewFile(item.file)}>
                  <Eye />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => actions.onDownload(item.file)}>
                  <Download />
                  Download
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onSelect={() => actions.onRename(item)}>
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => actions.onDelete(item)}
            >
              <Trash2 className="text-destructive" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </ItemContextMenu>
  );
});
