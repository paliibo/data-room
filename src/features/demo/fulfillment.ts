import { useDataStore } from "@/store/dataStore";
import type { ChecklistStatus } from "@/types";

/**
 * How the seeded documents answer the seeded requests. Matching by file name
 * keeps this readable and means the dataset and the checklist can each change
 * without a brittle index into the other.
 */
const FULFILLMENT: { request: string; files: string[]; status: ChecklistStatus }[] = [
  {
    request: "Certificate of incorporation",
    files: ["Certificate of incorporation.pdf"],
    status: "complete",
  },
  {
    request: "Cap table and option ledger",
    files: ["Cap table (post Series A).pdf"],
    status: "complete",
  },
  {
    request: "Board minutes (last 24 months)",
    files: [
      "2024-11 Board minutes.pdf",
      "2025-02 Board minutes.pdf",
      "2025-05 Board minutes.pdf",
    ],
    status: "complete",
  },
  {
    request: "Audited financial statements",
    files: ["Audited statements FY2024.pdf"],
    status: "complete",
  },
  {
    request: "Monthly management accounts",
    files: ["Management accounts Q1.pdf", "Management accounts Q2.pdf"],
    status: "complete",
  },
  { request: "Revenue by customer cohort", files: ["Revenue by cohort.pdf"], status: "in-review" },
  {
    request: "Top 20 customer contracts",
    files: ["Top 20 customer contracts.pdf"],
    status: "complete",
  },
  {
    request: "Supplier and reseller agreements",
    files: ["Reseller agreements.pdf"],
    status: "in-review",
  },
  {
    request: "Employment agreements for key staff",
    files: ["Key employment agreements.pdf"],
    status: "complete",
  },
  {
    request: "Employee equity plan documents",
    files: ["Equity plan documents.pdf"],
    status: "complete",
  },
  { request: "Registered IP and trademarks", files: ["Registered trademarks.pdf"], status: "complete" },
  {
    request: "Open source license inventory",
    files: ["Open source inventory.pdf"],
    status: "in-review",
  },
  {
    request: "Data processing agreements",
    files: ["Data processing agreements.pdf"],
    status: "complete",
  },
  // Litigation is deliberately left outstanding, so the room has open work.
];

export async function seedDemoFulfillment(): Promise<void> {
  const state = useDataStore.getState();
  const filesByName = new Map(
    Object.values(state.filesById).map((file) => [file.name, file.id]),
  );
  const requestsByTitle = new Map(
    Object.values(state.checklistById).map((item) => [item.title, item.id]),
  );

  for (const entry of FULFILLMENT) {
    const itemId = requestsByTitle.get(entry.request);
    if (!itemId) continue;
    const fileIds = entry.files
      .map((name) => filesByName.get(name))
      .filter((id): id is string => Boolean(id));
    if (fileIds.length === 0) continue;
    await useDataStore
      .getState()
      .updateChecklistItem(itemId, { fileIds, status: entry.status });
  }
}
