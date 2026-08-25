import { describe, expect, it } from "vitest";
import { folderPath, searchDataroom } from "@/features/command/utils";
import { makeFile, makeFolder } from "@/test/factories";

const corporate = makeFolder({ id: "corporate", name: "Corporate" });
const minutes = makeFolder({ id: "minutes", name: "Board minutes", parentId: "corporate" });
const foldersById = { corporate, minutes };

const filesById = {
  "f1": makeFile({ id: "f1", name: "Board pack.pdf", parentId: "minutes" }),
  "f2": makeFile({ id: "f2", name: "Annual board report.pdf", parentId: null }),
  "f3": makeFile({ id: "f3", name: "Cap table.pdf", parentId: "corporate" }),
};

describe("folderPath", () => {
  it("joins the room name with every ancestor", () => {
    expect(folderPath(foldersById, "minutes", "Atlas")).toBe("Atlas / Corporate / Board minutes");
  });

  it("is just the room name at the root", () => {
    expect(folderPath(foldersById, null, "Atlas")).toBe("Atlas");
  });

  it("terminates on a corrupt parent cycle", () => {
    const a = makeFolder({ id: "a", name: "A", parentId: "b" });
    const b = makeFolder({ id: "b", name: "B", parentId: "a" });
    expect(folderPath({ a, b }, "a", "Room")).toBe("Room / B / A");
  });
});

describe("searchDataroom", () => {
  it("returns nothing for an empty query", () => {
    expect(searchDataroom("   ", foldersById, filesById, "Atlas")).toEqual([]);
  });

  it("searches folders and files across the whole room, not one folder", () => {
    const hits = searchDataroom("board", foldersById, filesById, "Atlas");
    expect(hits.map((h) => (h.kind === "folder" ? h.folder!.name : h.file!.name))).toEqual(
      expect.arrayContaining(["Board minutes", "Board pack.pdf", "Annual board report.pdf"]),
    );
  });

  it("ranks prefix matches above mid-word matches", () => {
    const hits = searchDataroom("board", foldersById, filesById, "Atlas");
    const names = hits.map((h) => (h.kind === "folder" ? h.folder!.name : h.file!.name));
    expect(names.indexOf("Annual board report.pdf")).toBeGreaterThan(
      names.indexOf("Board pack.pdf"),
    );
  });

  it("is case-insensitive", () => {
    expect(searchDataroom("CAP TABLE", foldersById, filesById, "Atlas")).toHaveLength(1);
  });

  it("attaches a readable path to every hit", () => {
    const [hit] = searchDataroom("cap table", foldersById, filesById, "Atlas");
    expect(hit.path).toBe("Atlas / Corporate");
  });

  it("hides trashed items", () => {
    const trashed = {
      ...filesById,
      f3: { ...filesById.f3, deletedAt: "2026-01-01T00:00:00.000Z" },
    };
    expect(searchDataroom("cap table", foldersById, trashed, "Atlas")).toEqual([]);
  });

  it("caps the result list", () => {
    const many = Object.fromEntries(
      Array.from({ length: 30 }, (_, i) => [`m${i}`, makeFile({ id: `m${i}`, name: `Match ${i}.pdf` })]),
    );
    expect(searchDataroom("match", {}, many, "Atlas")).toHaveLength(8);
  });
});
