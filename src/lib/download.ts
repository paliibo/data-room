import { FileRepository } from "@/storage/repositories/FileRepository";

export async function downloadFile(fileId: string, fileName: string): Promise<void> {
  const blob = await FileRepository.getBlob(fileId);
  if (!blob) {
    throw new Error("The file content could not be found in local storage.");
  }
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
