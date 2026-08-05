import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentVars } from "@/lib/accent";
import { Badge } from "@/components/ui/badge";
import type { TagChipProps } from "@/components/shared/types";

export function TagChip({ tag, onRemove, interactive, className }: TagChipProps) {
  return (
    <Badge
      variant="tint"
      style={accentVars(tag.color)}
      className={cn(interactive && "cursor-pointer hover:brightness-105", className)}
    >
      <span className="size-1.5 rounded-full bg-tint" aria-hidden />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove tag ${tag.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 cursor-pointer rounded-full opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="size-2.5" aria-hidden />
        </button>
      )}
    </Badge>
  );
}
