import { describe, expect, it } from "vitest";
import {
  MAX_PDF_SIZE_BYTES,
  ensureUniqueName,
  entityNameSchema,
  isNameTaken,
  validatePdfFile,
} from "@/lib/validation";

describe("entityNameSchema", () => {
  it.each([
    ["", "empty"],
    ["   ", "whitespace only"],
    ["a/b", "path separator"],
    ['quote"', "double quote"],
    ["what?", "question mark"],
    ["trailing.", "trailing dot"],
    ["...", "only dots"],
    ["a".repeat(256), "too long"],
  ])("rejects %j (%s)", (name) => {
    expect(entityNameSchema.safeParse(name).success).toBe(false);
  });

  it.each(["Financials", "2024 Q1 — report", "a".repeat(255), "file.name.pdf"])(
    "accepts %j",
    (name) => {
      expect(entityNameSchema.safeParse(name).success).toBe(true);
    },
  );

  it("trims before validating", () => {
    expect(entityNameSchema.parse("  Corporate  ")).toBe("Corporate");
  });
});

describe("ensureUniqueName", () => {
  it("returns the name unchanged when free", () => {
    expect(ensureUniqueName("Report.pdf", ["Other.pdf"])).toBe("Report.pdf");
  });

  it("suffixes before the extension", () => {
    expect(ensureUniqueName("Report.pdf", ["Report.pdf"])).toBe("Report (2).pdf");
  });

  it("keeps counting past the first collision", () => {
    expect(ensureUniqueName("Report.pdf", ["Report.pdf", "Report (2).pdf"])).toBe(
      "Report (3).pdf",
    );
  });

  it("compares case-insensitively", () => {
    expect(ensureUniqueName("report.pdf", ["REPORT.PDF"])).toBe("report (2).pdf");
  });

  it("handles names with no extension", () => {
    expect(ensureUniqueName("Corporate", ["Corporate"])).toBe("Corporate (2)");
  });

  it("does not treat a leading dot as an extension", () => {
    expect(ensureUniqueName(".hidden", [".hidden"])).toBe(".hidden (2)");
  });
});

describe("isNameTaken", () => {
  it("detects a case-insensitive collision", () => {
    expect(isNameTaken("financials", ["Financials"])).toBe(true);
  });

  it("ignores the item's own current name when renaming", () => {
    expect(isNameTaken("Financials", ["Financials"], "Financials")).toBe(false);
  });

  it("still blocks a collision with a different sibling while renaming", () => {
    expect(isNameTaken("Legal", ["Financials", "Legal"], "Financials")).toBe(true);
  });
});

describe("validatePdfFile", () => {
  const file = (name: string, type: string, size: number) =>
    new File([new Uint8Array(size)], name, { type });

  it("accepts a well-formed PDF", () => {
    expect(validatePdfFile(file("a.pdf", "application/pdf", 10))).toBeNull();
  });

  it("accepts a .pdf with no reported MIME type", () => {
    expect(validatePdfFile(file("a.pdf", "", 10))).toBeNull();
  });

  it("rejects a non-PDF", () => {
    expect(validatePdfFile(file("a.png", "image/png", 10))?.reason).toMatch(/only pdf/i);
  });

  it("rejects an empty file", () => {
    expect(validatePdfFile(file("a.pdf", "application/pdf", 0))?.reason).toMatch(/empty/i);
  });

  it("rejects a file over the size limit", () => {
    const oversized = { name: "a.pdf", type: "application/pdf", size: MAX_PDF_SIZE_BYTES + 1 };
    expect(validatePdfFile(oversized as File)?.reason).toMatch(/200 MB/);
  });
});
