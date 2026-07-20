import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useDataStore } from "@/store/dataStore";

export function useUpload(parentId: string | null) {
  const uploadFiles = useDataStore((s) => s.uploadFiles);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setIsUploading(true);
      try {
        const { uploaded, rejected } = await uploadFiles(parentId, files);
        if (uploaded.length > 0) {
          toast.success(
            uploaded.length === 1
              ? `Uploaded "${uploaded[0].name}"`
              : `Uploaded ${uploaded.length} files`,
          );
        }
        for (const rejection of rejected) {
          toast.error(`Couldn't upload "${rejection.file.name}"`, {
            description: rejection.reason,
          });
        }
      } catch (error) {
        toast.error("Upload failed", {
          description:
            error instanceof Error ? error.message : "An unexpected error occurred",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [parentId, uploadFiles],
  );

  return { upload, isUploading };
}
