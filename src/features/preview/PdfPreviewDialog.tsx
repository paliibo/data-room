import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatBytes, formatDateTime } from "@/lib/format";
import type {
  MetadataRowProps,
  PdfPreviewDialogProps,
} from "@/features/preview/types";

const PdfViewer = lazy(() => import("./PdfViewer"));

function MetadataRow({ label, value }: MetadataRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}

export function PdfPreviewDialog({ file, onOpenChange }: PdfPreviewDialogProps) {
  return (
    <Dialog open={Boolean(file)} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-3 sm:max-w-4xl">
        {file && (
          <>
            <DialogHeader className="pr-8">
              <DialogTitle className="truncate" title={file.name}>
                {file.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                PDF preview of {file.name}
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              <MetadataRow label="Size" value={formatBytes(file.size)} />
              <MetadataRow label="Uploaded" value={formatDateTime(file.uploadedAt)} />
              <MetadataRow label="Original filename" value={file.originalFilename} />
              <MetadataRow label="Type" value={file.mimeType} />
            </dl>
            <Separator />
            <div className="min-h-0 flex-1">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading viewer…
                  </div>
                }
              >
                <PdfViewer fileId={file.id} fileName={file.name} />
              </Suspense>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
