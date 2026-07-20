import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { Upload } from "lucide-react";
import type { UploadDropzoneProps } from "@/features/browser/types";

export function UploadDropzone({ onFiles, onOpenRef, children }: UploadDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (accepted, rejected) => {
      onFiles([...accepted, ...rejected.map((r) => r.file)]);
    },
    accept: { "application/pdf": [".pdf"] },
    noClick: true,
    noKeyboard: true,
  });

  onOpenRef?.(open);

  return (
    <div {...getRootProps({ className: "relative flex min-h-0 flex-1 flex-col" })}>
      <input {...getInputProps({ "aria-label": "Upload PDF files" })} />
      {children}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute inset-2 z-40 flex items-center justify-center rounded-xl border-2 border-dashed border-brand bg-brand/10 backdrop-blur-[1px]"
          >
            <div className="flex flex-col items-center gap-2 rounded-xl bg-background/90 px-8 py-6 shadow-lg">
              <Upload className="h-8 w-8 text-brand" aria-hidden />
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
