import { AnimatePresence } from "framer-motion";
import { FolderOpen, SearchX, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useUiStore } from "@/store/uiStore";
import { ItemCard } from "./ItemCard";
import { ItemRow } from "./ItemRow";
import { SCOPE_COPY, itemId } from "@/features/browser/utils";
import type {
  BrowserItem,
  ContentViewProps,
  LoadingSkeletonProps,
} from "@/features/browser/types";

function LoadingSkeleton({ viewMode }: LoadingSkeletonProps) {
  if (viewMode === "list") {
    return (
      <div className="space-y-1.5" aria-label="Loading contents" role="status">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      aria-label="Loading contents"
      role="status"
    >
      {Array.from({ length: 10 }, (_, i) => (
        <Skeleton key={i} className="h-44 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ContentView({
  folders,
  files,
  status,
  scope,
  searchQuery,
  selectedIds,
  actions,
  onSelect,
  onToggleSelect,
  onUpload,
  onNewFolder,
  onClearSearch,
}: ContentViewProps) {
  const viewMode = useUiStore((s) => s.viewMode);

  if (status === "loading" || status === "idle") {
    return <LoadingSkeleton viewMode={viewMode} />;
  }

  const items: BrowserItem[] = [
    ...folders.map((folder) => ({ kind: "folder" as const, folder })),
    ...files.map((file) => ({ kind: "file" as const, file })),
  ];

  if (items.length === 0) {
    if (searchQuery.trim()) {
      return (
        <EmptyState
          icon={SearchX}
          title={`No matches for "${searchQuery.trim()}"`}
          description="Try a different term, or search the whole dataroom from the command palette."
          action={
            <Button variant="outline" size="sm" onClick={onClearSearch}>
              Clear filter
            </Button>
          }
        />
      );
    }
    const copy = SCOPE_COPY[scope];
    return (
      <EmptyState
        icon={scope === "trash" ? Trash2 : FolderOpen}
        title={copy.empty}
        description={copy.description}
        action={
          scope === "folder" ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onNewFolder}>
                New folder
              </Button>
              <Button variant="brand" size="sm" onClick={onUpload}>
                <Upload aria-hidden /> Upload PDFs
              </Button>
            </div>
          ) : undefined
        }
      />
    );
  }

  const selected = new Set(selectedIds);
  const isSelecting = selectedIds.length > 1;

  const shared = (item: BrowserItem) => ({
    key: itemId(item),
    item,
    actions,
    scope,
    isSelected: selected.has(itemId(item)),
    isSelecting,
    onSelect,
    onToggleSelect,
  });

  if (viewMode === "list") {
    return (
      <div role="list" aria-label="Contents">
        <div className="hidden grid-cols-[auto_minmax(0,1fr)_6rem_10rem_2.25rem] gap-2.5 border-b px-2.5 pb-2 text-xs font-medium text-muted-foreground sm:grid">
          <span className="w-4" />
          <span>Name</span>
          <span className="text-right">Size</span>
          <span className="text-right">Modified</span>
          <span />
        </div>
        <div className="mt-1 space-y-0.5">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <ItemRow {...shared(item)} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Contents"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <ItemCard {...shared(item)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
