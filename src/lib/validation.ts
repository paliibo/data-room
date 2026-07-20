import { z } from "zod";

const INVALID_NAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/;

export const MAX_NAME_LENGTH = 255;
export const MAX_PDF_SIZE_BYTES = 200 * 1024 * 1024;

export const entityNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`)
  .refine((name) => !INVALID_NAME_CHARS.test(name), {
    message: 'Name cannot contain < > : " / \\ | ? *',
  })
  .refine((name) => !/^\.+$/.test(name), {
    message: "Name cannot consist only of dots",
  })
  .refine((name) => !name.endsWith("."), {
    message: "Name cannot end with a dot",
  });

export const renameFormSchema = z.object({ name: entityNameSchema });
export type RenameFormValues = z.infer<typeof renameFormSchema>;

export type UploadRejection = {
  file: File;
  reason: string;
};

export function validatePdfFile(file: File): UploadRejection | null {
  const isPdf =
    file.type === "application/pdf" ||
    (file.type === "" && file.name.toLowerCase().endsWith(".pdf"));
  if (!isPdf) {
    return { file, reason: "Only PDF files are supported" };
  }
  if (file.size === 0) {
    return { file, reason: "File is empty" };
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return { file, reason: "File exceeds the 200 MB limit" };
  }
  return null;
}

export function ensureUniqueName(
  name: string,
  siblingNames: Iterable<string>,
): string {
  const taken = new Set(
    Array.from(siblingNames, (n) => n.toLocaleLowerCase()),
  );
  if (!taken.has(name.toLocaleLowerCase())) return name;

  const dotIndex = name.lastIndexOf(".");
  const stem = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  const extension = dotIndex > 0 ? name.slice(dotIndex) : "";

  for (let counter = 2; ; counter++) {
    const candidate = `${stem} (${counter})${extension}`;
    if (!taken.has(candidate.toLocaleLowerCase())) return candidate;
  }
}

export function isNameTaken(
  name: string,
  siblingNames: Iterable<string>,
  ignoreName?: string,
): boolean {
  const target = name.trim().toLocaleLowerCase();
  const ignored = ignoreName?.toLocaleLowerCase();
  for (const sibling of siblingNames) {
    const lower = sibling.toLocaleLowerCase();
    if (lower === ignored) continue;
    if (lower === target) return true;
  }
  return false;
}
