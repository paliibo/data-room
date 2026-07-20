import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { FileRepository } from "@/storage/repositories/FileRepository";
import { Button } from "@/components/ui/button";
import type { PdfViewerProps, ViewerState } from "@/features/preview/types";

export default function PdfViewer({ fileId, fileName }: PdfViewerProps) {
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
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading document…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <iframe
        src={state.url}
        title={`Preview of ${fileName}`}
        className="h-full w-full rounded-lg border bg-muted"
      />
      <div className="flex justify-end pt-3">
        <Button asChild variant="outline" size="sm">
          <a href={state.url} download={fileName}>
            Download
          </a>
        </Button>
      </div>
    </div>
  );
}
