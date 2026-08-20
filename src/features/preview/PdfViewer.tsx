import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { FileRepository } from "@/storage/repositories/FileRepository";
import type { PdfViewerProps, ViewerState } from "@/features/preview/types";

/**
 * The browser's own PDF renderer over a blob URL. Zero dependencies, lazily
 * loaded, and it brings zoom, search and print for free — pdf.js would add
 * ~400 kB for little gain here, and this component is the seam if that changes.
 */
export default function PdfViewer({
  fileId,
  fileName,
  watermark,
  allowDownload = true,
}: PdfViewerProps) {
  const [state, setState] = useState<ViewerState>({ status: "loading" });

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setState({ status: "loading" });

    FileRepository.getBlob(fileId)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setState({
            status: "error",
            message: "The file content could not be found in local storage.",
          });
          return;
        }
        objectUrl = URL.createObjectURL(
          blob.type === "application/pdf"
            ? blob
            : new Blob([blob], { type: "application/pdf" }),
        );
        setState({ status: "ready", url: objectUrl });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Failed to load the file.",
        });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  if (state.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading document…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertTriangle className="size-8 text-destructive" aria-hidden />
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  // On a view-only link, hide the built-in viewer chrome so its save and print
  // buttons are not the first thing a recipient sees. This is a UX signal, not a
  // security control — a determined visitor can always reach the bytes, which is
  // exactly why real data rooms watermark rather than rely on blocking.
  const src = allowDownload ? state.url : `${state.url}#toolbar=0&navpanes=0`;

  return (
    <div className="relative h-full overflow-hidden rounded-lg border bg-muted">
      <iframe
        src={src}
        title={`Preview of ${fileName}`}
        className="size-full"
      />
      {watermark && (
        // Non-interactive overlay: it marks the copy on screen without getting
        // between the reader and the viewer's own controls.
        <div
          className="watermark pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          aria-hidden
        >
          <span className="-rotate-[24deg] select-none whitespace-nowrap text-4xl font-semibold uppercase tracking-[0.2em] text-brand/15">
            {watermark}
          </span>
        </div>
      )}
    </div>
  );
}
