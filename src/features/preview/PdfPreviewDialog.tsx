import { Suspense, lazy, useEffect } from "react";
import { Download, Loader2, Tag as TagIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TagChip } from "@/components/shared/TagChip";
import { useDataStore } from "@/store/dataStore";
import { useFileTags } from "@/hooks/useTags";
import { formatBytes, formatDateTime } from "@/lib/format";
import type {
  MetadataRowProps,
  PdfPreviewDialogProps,
} from "@/features/preview/types";

const PdfViewer = lazy(() => import("./PdfViewer"));

function MetadataRow({ label, value }: MetadataRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium tabular" title={value}>
        {value}
      </dd>
    </div>
  );
}

export function PdfPreviewDialog({
  file,
  onOpenChange,
  onEditTags,
  onDownload,
  readOnly = false,
  watermark = null,
  allowDownload = true,
}: PdfPreviewDialogProps) {
  const logActivity = useDataStore((s) => s.logActivity);
  const tags = useFileTags(file?.tagIds ?? []);
  const fileId = file?.id;
  const fileName = file?.name;

  // Opening the preview is what "a view" means, and the analytics dashboard
  // reads it straight back out of the audit log.
  useEffect(() => {
    if (!fileId || !fileName || readOnly) return;
    logActivity({ type: "file.view", targetId: fileId, targetName: fileName }).catch(
      () => undefined,
    );
  }, [fileId, fileName, readOnly, logActivity]);

  return (
    <Dialog open={Boolean(file)} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] max-w-5xl flex-col gap-3 sm:max-w-5xl">
        {file && (
          <>
            <DialogHeader className="pr-10">
              <DialogTitle className="truncate text-base" title={file.name}>
                {file.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                PDF preview of {file.name}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <MetadataRow label="Size" value={formatBytes(file.size)} />
                <MetadataRow label="Uploaded" value={formatDateTime(file.uploadedAt)} />
                <MetadataRow label="Original" value={file.originalFilename} />
              </dl>

              {!readOnly && (
                <div className="flex items-center gap-2">
                  {onEditTags && (
                    <Button variant="outline" size="sm" onClick={() => onEditTags(file)}>
                      <TagIcon aria-hidden />
                      Tags
                    </Button>
                  )}
                  {allowDownload && onDownload && (
                    <Button variant="soft" size="sm" onClick={() => onDownload(file)}>
                      <Download aria-hidden />
                      Download
                    </Button>
                  )}
                </div>
              )}
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <TagChip key={tag.id} tag={tag} />
                ))}
              </div>
            )}

            <Separator />

            <div className="min-h-0 flex-1">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading viewer…
                  </div>
                }
              >
                <PdfViewer
                  fileId={file.id}
                  fileName={file.name}
                  watermark={watermark}
                  allowDownload={allowDownload}
                />
              </Suspense>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
