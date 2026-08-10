import { FileText, MoreHorizontal, Paperclip, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_META, type ChecklistRowProps } from "@/features/checklist/types";
import type { ChecklistStatus } from "@/types";

export function ChecklistRow({
  item,
  files,
  onStatusChange,
  onAttach,
  onDelete,
  onOpenFile,
}: ChecklistRowProps) {
  const meta = STATUS_META[item.status];

  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-lg border px-3.5 py-3 transition-colors",
        item.status === "complete" ? "border-success/25 bg-success/5" : "bg-card",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={cn(
            "min-w-0 flex-1 text-sm font-medium",
            item.status === "complete" && "text-muted-foreground",
          )}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-1.5">
          <Badge variant={meta.badge}>{meta.label}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${item.title}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={item.status}
                onValueChange={(value) => onStatusChange(item.id, value as ChecklistStatus)}
              >
                {(Object.keys(STATUS_META) as ChecklistStatus[]).map((status) => (
                  <DropdownMenuRadioItem key={status} value={status}>
                    {STATUS_META[status].label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onAttach(item)}>
                <Paperclip />
                Link documents
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDelete(item.id)}
              >
                <Trash2 className="text-destructive" />
                Remove request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {files.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {files.map((file) => (
            <li key={file.id}>
              <button
                type="button"
                onClick={() => onOpenFile(file)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs transition-colors hover:bg-accent"
              >
                <FileText className="size-3 text-destructive/70" aria-hidden />
                <span className="max-w-48 truncate">{file.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <button
          type="button"
          onClick={() => onAttach(item)}
          className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Paperclip className="size-3" aria-hidden />
          Link a document
        </button>
      )}
    </li>
  );
}
