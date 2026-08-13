import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { Upload } from "lucide-react";
import type { UploadDropzoneProps } from "@/features/browser/types";

export function UploadDropzone({
  onFiles,
  onOpenRef,
  disabled,
  children,
}: UploadDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    // Rejected files are forwarded too: the store produces a specific reason per
    // file, which is a better message than dropzone's generic one.
    onDrop: (accepted, rejected) => {
      onFiles([...accepted, ...rejected.map((r) => r.file)]);
    },
    accept: { "application/pdf": [".pdf"] },
    noClick: true,
    noKeyboard: true,
    disabled,
  });

  onOpenRef?.(open);

  return (
    <div {...getRootProps({ className: "relative flex min-h-0 flex-1 flex-col" })}>
      <input {...getInputProps({ "aria-label": "Upload PDF files" })} />
      {children}
      <AnimatePresence>
        {isDragActive && !disabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute inset-3 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-brand bg-brand/10 backdrop-blur-[2px]"
          >
            <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-8 py-6 elevate-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft">
                <Upload className="size-5 text-brand" aria-hidden />
              </span>
              <p className="text-sm font-medium">Drop PDFs to upload</p>
              <p className="text-xs text-muted-foreground">
                They will be added to the current folder
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
