import {
  Download,
  Eye,
  FolderOpen,
  Link2,
  Pencil,
  RotateCcw,
  Star,
  StarOff,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { ItemContextMenuProps } from "@/features/browser/types";

export function ItemContextMenu({ item, actions, scope, children }: ItemContextMenuProps) {
  const isFolder = item.kind === "folder";
  const starred = isFolder ? item.folder.starred : item.file.starred;

  // In the trash the only meaningful choices are back or gone for good.
  if (scope === "trash") {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => actions.onRestore(item)}>
            <RotateCcw />
            Restore
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => actions.onPurge(item)}
          >
            <Trash2 className="text-destructive" />
            Delete permanently
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {isFolder ? (
          <>
            <ContextMenuItem onSelect={() => actions.onOpenFolder(item.folder.id)}>
              <FolderOpen />
              Open
              <ContextMenuShortcut>↵</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => actions.onDownloadFolder(item.folder)}>
              <Download />
              Download as ZIP
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => actions.onShare(item.folder.id)}>
              <Link2 />
              Share this folder
            </ContextMenuItem>
          </>
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
            <ContextMenuItem onSelect={() => actions.onEditTags(item.file)}>
              <TagIcon />
              Edit tags
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => actions.onToggleStar(item)}>
          {starred ? <StarOff /> : <Star />}
          {starred ? "Remove star" : "Add star"}
          <ContextMenuShortcut>S</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => actions.onRename(item)}>
          <Pencil />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => actions.onTrash(item)}
        >
          <Trash2 className="text-destructive" />
          Move to trash
          <ContextMenuShortcut>⌦</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
