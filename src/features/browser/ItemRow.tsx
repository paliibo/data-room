import { memo, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  Link2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Star,
  StarOff,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes, formatDateTime } from "@/lib/format";
import { getDragPayload, isItemDrag, setDragPayload } from "@/lib/dnd";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagChip } from "@/components/shared/TagChip";
import { useFileTags } from "@/hooks/useTags";
import { useUiStore } from "@/store/uiStore";
import { ItemContextMenu } from "./ItemContextMenu";
import { itemId, itemName } from "@/features/browser/utils";
import type { ItemViewProps } from "@/features/browser/types";

export const ItemRow = memo(function ItemRow({
  item,
  actions,
  scope,
  isSelected,
  isSelecting,
  onSelect,
  onToggleSelect,
}: ItemViewProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const density = useUiStore((s) => s.density);
  const id = itemId(item);
  const name = itemName(item);
  const isFolder = item.kind === "folder";
  const starred = isFolder ? item.folder.starred : item.file.starred;
  const tags = useFileTags(isFolder ? [] : item.file.tagIds);
  const isTrash = scope === "trash";

  const open = () =>
    isFolder ? actions.onOpenFolder(id) : actions.onPreviewFile(item.file);

  return (
    <ItemContextMenu item={item} actions={actions} scope={scope}>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        role="button"
        tabIndex={0}
        aria-label={`${isFolder ? "Folder" : "File"}: ${name}`}
        aria-selected={isSelected}
        className={cn(
          "group grid cursor-pointer select-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-transparent px-2.5 transition-colors",
          "sm:grid-cols-[auto_minmax(0,1fr)_6rem_10rem_2.25rem]",
          density === "compact" ? "py-1" : "py-2",
          "hover:bg-accent/60",
          isSelected && "border-brand/50 bg-brand-soft/40",
          isDropTarget && "border-brand bg-brand-soft",
        )}
        draggable={!isTrash}
        onDragStart={(e) =>
          setDragPayload(e as unknown as React.DragEvent, { kind: item.kind, id })
        }
        onDragOver={(e) => {
          if (isFolder && !isTrash && isItemDrag(e as unknown as React.DragEvent)) {
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
            "flex items-center transition-opacity",
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

        <div className="flex min-w-0 items-center gap-2.5">
          {isFolder ? (
            <FolderIcon className="size-4.5 shrink-0 text-brand" aria-hidden />
          ) : (
            <FileText className="size-4.5 shrink-0 text-destructive/70" aria-hidden />
          )}
          <span className="truncate text-sm font-medium" title={name}>
            {name}
          </span>
          {starred && (
            <Star className="size-3 shrink-0 fill-warning text-warning" aria-label="Starred" />
          )}
          {tags.length > 0 && (
            <span className="hidden shrink-0 gap-1 lg:flex">
              {tags.slice(0, 2).map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </span>
          )}
        </div>

        <span className="hidden text-right text-xs text-muted-foreground tabular sm:block">
          {isFolder ? "—" : formatBytes(item.file.size)}
        </span>
        <span className="hidden text-right text-xs text-muted-foreground tabular sm:block">
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
          <DropdownMenuContent align="end" className="w-52">
            {isTrash ? (
              <>
                <DropdownMenuItem onSelect={() => actions.onRestore(item)}>
                  <RotateCcw />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => actions.onPurge(item)}
                >
                  <Trash2 className="text-destructive" />
                  Delete permanently
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {isFolder ? (
                  <>
                    <DropdownMenuItem onSelect={() => actions.onOpenFolder(id)}>
                      <FolderOpen />
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => actions.onDownloadFolder(item.folder)}>
                      <Download />
                      Download as ZIP
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => actions.onShare(item.folder.id)}>
                      <Link2 />
                      Share this folder
                    </DropdownMenuItem>
                  </>
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
                    <DropdownMenuItem onSelect={() => actions.onEditTags(item.file)}>
                      <TagIcon />
                      Edit tags
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => actions.onToggleStar(item)}>
                  {starred ? <StarOff /> : <Star />}
                  {starred ? "Remove star" : "Add star"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => actions.onRename(item)}>
                  <Pencil />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => actions.onTrash(item)}
                >
                  <Trash2 className="text-destructive" />
                  Move to trash
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </ItemContextMenu>
  );
});
