import { AnimatePresence } from "framer-motion";
import { FolderOpen, SearchX, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useUiStore } from "@/store/uiStore";
import { ItemCard } from "./ItemCard";
import { ItemRow } from "./ItemRow";
import { itemId } from "@/features/browser/utils";
import type {
  BrowserItem,
  ContentViewProps,
  LoadingSkeletonProps,
} from "@/features/browser/types";

function LoadingSkeleton({ viewMode }: LoadingSkeletonProps) {
  if (viewMode === "list") {
    return (
      <div className="space-y-2" aria-label="Loading contents" role="status">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
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
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ContentView({
  folders,
  files,
  status,
  searchQuery,
  selectedId,
  onSelect,
  actions,
  onUpload,
  onNewFolder,
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
          title={`No results for "${searchQuery.trim()}"`}
          description="Try a different search term, or look in another folder."
        />
      );
    }
    return (
      <EmptyState
        icon={FolderOpen}
        title="This folder is empty"
        description="Drag & drop PDF files anywhere on this page, or create a folder to organize documents."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onNewFolder}>
              New folder
            </Button>
            <Button variant="brand" size="sm" onClick={onUpload}>
              <Upload aria-hidden /> Upload PDFs
            </Button>
          </div>
        }
      />
    );
  }

  if (viewMode === "list") {
    return (
      <div role="list" aria-label="Folder contents">
        <div className="hidden grid-cols-[minmax(0,1fr)_7rem_11rem_2.5rem] gap-2 border-b px-3 pb-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>Name</span>
          <span className="text-right">Size</span>
          <span className="text-right">Modified</span>
          <span />
        </div>
        <div className="mt-1 space-y-0.5">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <ItemRow
                key={itemId(item)}
                item={item}
                actions={actions}
                isSelected={selectedId === itemId(item)}
                onSelect={onSelect}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Folder contents"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <ItemCard
            key={itemId(item)}
            item={item}
            actions={actions}
            isSelected={selectedId === itemId(item)}
            onSelect={onSelect}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
