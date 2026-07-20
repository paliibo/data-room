import { memo, useState } from "react";
import { ChevronRight, Folder as FolderIcon, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDragPayload, isItemDrag, setDragPayload } from "@/lib/dnd";
import type { FolderNodeProps } from "@/features/browser/types";

export const FolderNode = memo(function FolderNode({
  node,
  isActive,
  onNavigate,
  onToggle,
  onDropItem,
}: FolderNodeProps) {
  const { folder, depth, hasChildren, isExpanded } = node;
  const [isDropTarget, setIsDropTarget] = useState(false);

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isActive}
      className={cn(
        "group flex h-8 cursor-pointer select-none items-center gap-1 rounded-md pr-2 text-sm transition-colors",
        isActive
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        isDropTarget && "ring-2 ring-brand ring-inset bg-brand/10",
      )}
      style={{ paddingLeft: `${depth * 16 + 4}px` }}
      tabIndex={-1}
      draggable
      onDragStart={(e) => setDragPayload(e, { kind: "folder", id: folder.id })}
      onDragOver={(e) => {
        if (!isItemDrag(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDropTarget(true);
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(e) => {
        setIsDropTarget(false);
        const payload = getDragPayload(e);
        if (payload) {
          e.preventDefault();
          e.stopPropagation();
          onDropItem(payload, folder.id);
        }
      }}
      onClick={() => onNavigate(folder.id)}
    >
      <button
        type="button"
        aria-label={isExpanded ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
        tabIndex={-1}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-accent",
          !hasChildren && "invisible",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(folder.id);
        }}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-150",
            isExpanded && "rotate-90",
          )}
        />
      </button>
      {isActive || isExpanded ? (
        <FolderOpen className="h-4 w-4 shrink-0 text-brand" aria-hidden />
      ) : (
        <FolderIcon className="h-4 w-4 shrink-0" aria-hidden />
      )}
      <span className="truncate" title={folder.name}>
        {folder.name}
      </span>
    </div>
  );
});
