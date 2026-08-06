import { Tag as TagIcon, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/store/uiStore";
import { accentVars } from "@/lib/accent";
import type { TagFilterMenuProps } from "@/features/browser/types";

export function TagFilterMenu({ tags, counts }: TagFilterMenuProps) {
  const { tagFilter, toggleTagFilter, clearTagFilter } = useUiStore(
    useShallow((s) => ({
      tagFilter: s.tagFilter,
      toggleTagFilter: s.toggleTagFilter,
      clearTagFilter: s.clearTagFilter,
    })),
  );

  if (tags.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={tagFilter.length > 0 ? "soft" : "outline"}
          size="sm"
          aria-label="Filter by tag"
        >
          <TagIcon aria-hidden />
          <span className="hidden sm:inline">Tags</span>
          {tagFilter.length > 0 && (
            <Badge variant="brand" className="h-4 px-1 tabular">
              {tagFilter.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter by tag</DropdownMenuLabel>
        {tags.map((tag) => (
          <DropdownMenuCheckboxItem
            key={tag.id}
            checked={tagFilter.includes(tag.id)}
            onCheckedChange={() => toggleTagFilter(tag.id)}
            onSelect={(event) => event.preventDefault()}
          >
            <span
              className="size-2 shrink-0 rounded-full bg-tint"
              style={accentVars(tag.color)}
              aria-hidden
            />
            <span className="truncate">{tag.name}</span>
            <span className="ml-auto text-xs text-muted-foreground tabular">
              {counts[tag.id] ?? 0}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {tagFilter.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={clearTagFilter}>
              <X aria-hidden />
              Clear filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
