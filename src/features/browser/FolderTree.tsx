import { useCallback } from "react";
import { FolderTree as FolderTreeIcon, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolderTree } from "@/hooks/useFolderTree";
import { useUiStore } from "@/store/uiStore";
import { getDragPayload, isItemDrag } from "@/lib/dnd";
import { FolderNode } from "./FolderNode";
import type { FolderTreeProps } from "@/features/browser/types";

export function FolderTree({ activeFolderId, onNavigate, onMoveItem }: FolderTreeProps) {
  const nodes = useFolderTree();
  const toggleFolderExpanded = useUiStore((s) => s.toggleFolderExpanded);

  const handleToggle = useCallback(
    (folderId: string) => toggleFolderExpanded(folderId),
    [toggleFolderExpanded],
  );

  return (
    <nav aria-label="Folders" className="flex flex-col gap-0.5 px-2">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "flex h-8 cursor-pointer select-none items-center gap-2 rounded-md px-2 text-sm transition-colors",
          activeFolderId === null
            ? "bg-accent font-medium text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )}
        onClick={() => onNavigate(null)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onNavigate(null);
        }}
        onDragOver={(e) => {
          if (isItemDrag(e)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={(e) => {
          const payload = getDragPayload(e);
          if (payload) {
            e.preventDefault();
            onMoveItem(payload, null);
          }
        }}
      >
        <HardDrive className="h-4 w-4 shrink-0" aria-hidden />
        All documents
      </div>

      {nodes.length === 0 ? (
        <p className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
          <FolderTreeIcon className="h-3.5 w-3.5" aria-hidden />
          No folders yet
        </p>
      ) : (
        <div role="tree" aria-label="Folder tree">
          {nodes.map((node) => (
            <FolderNode
              key={node.folder.id}
              node={node}
              isActive={node.folder.id === activeFolderId}
              onNavigate={onNavigate}
              onToggle={handleToggle}
              onDropItem={onMoveItem}
            />
          ))}
        </div>
      )}
    </nav>
  );
}
