import { forwardRef } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  FolderPlus,
  LayoutGrid,
  List,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUiStore } from "@/store/uiStore";
import { SORT_LABELS } from "@/features/browser/utils";
import type { ShortcutHintProps, ToolbarProps } from "@/features/browser/types";
import type { SortField } from "@/types";

function ShortcutHint({ label, keys }: ShortcutHintProps) {
  return (
    <span className="flex items-center gap-2">
      {label}
      <kbd className="rounded bg-primary-foreground/20 px-1.5 py-0.5 font-mono text-[10px]">
        {keys}
      </kbd>
    </span>
  );
}

export const Toolbar = forwardRef<HTMLInputElement, ToolbarProps>(function Toolbar(
  { searchQuery, onSearchChange, onNewFolder, onUpload },
  searchInputRef,
) {
  const { viewMode, sortField, sortDirection, setViewMode, setSort } = useUiStore(
    useShallow((s) => ({
      viewMode: s.viewMode,
      sortField: s.sortField,
      sortDirection: s.sortDirection,
      setViewMode: s.setViewMode,
      setSort: s.setSort,
    })),
  );

  const SortDirectionIcon = sortDirection === "asc" ? ArrowDownAZ : ArrowUpAZ;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-40 flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search in this dataroom…"
          aria-label="Search folders and files"
          className="pl-8 pr-8"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Sort options">
              <SortDirectionIcon aria-hidden />
              <span className="hidden sm:inline">{SORT_LABELS[sortField]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
              <DropdownMenuCheckboxItem
                key={field}
                checked={sortField === field}
                onCheckedChange={() => setSort(field)}
              >
                {SORT_LABELS[field]}
                {sortField === field && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {sortDirection === "asc" ? "A→Z" : "Z→A"}
                  </span>
                )}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div
          role="group"
          aria-label="View mode"
          className="flex rounded-md border shadow-sm"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                className="rounded-r-none"
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <ShortcutHint label="Grid view" keys="G" />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                className="rounded-l-none"
                aria-label="List view"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
              >
                <List aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <ShortcutHint label="List view" keys="G" />
            </TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onNewFolder}>
              <FolderPlus aria-hidden />
              <span className="hidden sm:inline">New folder</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <ShortcutHint label="New folder" keys="N" />
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="brand" size="sm" onClick={onUpload}>
              <Upload aria-hidden />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <ShortcutHint label="Upload PDFs" keys="U" />
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});
