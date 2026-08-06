import { AnimatePresence, motion } from "framer-motion";
import { Download, RotateCcw, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { BulkActionBarProps } from "@/features/browser/types";

/**
 * Floating action bar for multi-selection. Anchored to the content area rather
 * than the viewport so it never covers the sidebar on narrow screens.
 */
export function BulkActionBar({
  count,
  scope,
  onClear,
  onDownload,
  onStar,
  onTrash,
  onRestore,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          role="toolbar"
          aria-label={`${count} items selected`}
          className="pointer-events-auto fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-elevated px-2 py-1.5 elevate-3 md:left-[calc(50%+8rem)]"
        >
          <span className="px-2 text-sm font-medium tabular">
            {count} selected
          </span>
          <Separator orientation="vertical" className="mx-1 h-5" />

          {scope === "trash" ? (
            <Button variant="ghost" size="sm" onClick={onRestore}>
              <RotateCcw aria-hidden />
              Restore
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onDownload}>
                <Download aria-hidden />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onStar}>
                <Star aria-hidden />
                <span className="hidden sm:inline">Star</span>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onTrash}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 aria-hidden />
            <span className="hidden sm:inline">
              {scope === "trash" ? "Delete" : "Trash"}
            </span>
          </Button>

          <Separator orientation="vertical" className="mx-1 h-5" />
          <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Clear selection">
            <X aria-hidden />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
