import {
  ArrowDownAZ,
  ArrowUpAZ,
  FolderPlus,
  LayoutGrid,
  Link2,
  List,
  Rows3,
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
import { Kbd } from "@/components/shared/Kbd";
import { useUiStore } from "@/store/uiStore";
import { useTags, useTagCounts } from "@/hooks/useTags";
import { SORT_LABELS } from "@/features/browser/utils";
import { TagFilterMenu } from "./TagFilterMenu";
import type { ToolbarProps } from "@/features/browser/types";
import type { SortField } from "@/types";

function Hint({ label, keys }: { label: string; keys: string }) {
  return (
    <span className="flex items-center gap-2">
      {label}
      <Kbd keys={keys} />
    </span>
  );
}

export function Toolbar({
  searchQuery,
  onSearchChange,
  onNewFolder,
  onUpload,
  onShare,
  scope,
  searchInputRef,
}: ToolbarProps) {
  const { viewMode, sortField, sortDirection, density, setViewMode, setSort, toggleDensity } =
    useUiStore(
      useShallow((s) => ({
        viewMode: s.viewMode,
        sortField: s.sortField,
        sortDirection: s.sortDirection,
        density: s.density,
        setViewMode: s.setViewMode,
        setSort: s.setSort,
        toggleDensity: s.toggleDensity,
      })),
    );
  const tags = useTags();
  const tagCounts = useTagCounts();

  const SortDirectionIcon = sortDirection === "asc" ? ArrowDownAZ : ArrowUpAZ;
  const isTrash = scope === "trash";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-40 flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter this view…"
          aria-label="Filter folders and files"
          className="pl-8 pr-8"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear filter"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TagFilterMenu tags={tags} counts={tagCounts} />

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

        <div role="group" aria-label="View mode" className="flex rounded-lg border elevate-1">
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
              <Hint label="Grid view" keys="g" />
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
              <Hint label="List view" keys="g" />
            </TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleDensity}
              aria-label={
                density === "comfortable" ? "Switch to compact rows" : "Switch to comfortable rows"
              }
              aria-pressed={density === "compact"}
            >
              <Rows3 aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {density === "comfortable" ? "Compact rows" : "Comfortable rows"}
          </TooltipContent>
        </Tooltip>

        {!isTrash && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onShare}>
                  <Link2 aria-hidden />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <Hint label="Create share link" keys="mod+shift+s" />
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onNewFolder}>
                  <FolderPlus aria-hidden />
                  <span className="hidden sm:inline">Folder</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <Hint label="New folder" keys="n" />
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
                <Hint label="Upload PDFs" keys="u" />
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
