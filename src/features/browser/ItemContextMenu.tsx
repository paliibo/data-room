import { Download, Eye, FolderOpen, Pencil, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { ItemContextMenuProps } from "@/features/browser/types";

export function ItemContextMenu({ item, actions, children }: ItemContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {item.kind === "folder" ? (
          <ContextMenuItem onSelect={() => actions.onOpenFolder(item.folder.id)}>
            <FolderOpen />
            Open
            <ContextMenuShortcut>↵</ContextMenuShortcut>
          </ContextMenuItem>
        ) : (
          <>
            <ContextMenuItem onSelect={() => actions.onPreviewFile(item.file)}>
              <Eye />
              Preview
              <ContextMenuShortcut>↵</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => actions.onDownload(item.file)}>
              <Download />
              Download
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem onSelect={() => actions.onRename(item)}>
          <Pencil />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => actions.onDelete(item)}
        >
          <Trash2 className="text-destructive" />
          Delete
          <ContextMenuShortcut>⌦</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
