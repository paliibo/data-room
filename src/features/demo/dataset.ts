import type { AccentColor } from "@/types";

export interface DemoFile {
  name: string;
  /** Subtitle printed inside the generated PDF. */
  summary: string;
  tags: string[];
  starred?: boolean;
}

export interface DemoFolder {
  name: string;
  files: DemoFile[];
  children?: DemoFolder[];
}

export interface DemoDataset {
  name: string;
  description: string;
  accent: AccentColor;
  tags: { name: string; color: AccentColor }[];
  tree: DemoFolder[];
  rootFiles: DemoFile[];
}

/** A plausible Series B diligence room — enough depth to exercise every view. */
export const DEMO_DATASET: DemoDataset = {
  name: "Project Atlas — Series B",
  description:
    "Buy-side diligence room for the Atlas Series B. Financials, contracts and IP under review.",
  accent: "indigo",
  tags: [
    { name: "Confidential", color: "rose" },
    { name: "Signed", color: "emerald" },
    { name: "Needs review", color: "amber" },
    { name: "Board pack", color: "violet" },
  ],
  rootFiles: [
    {
      name: "Diligence index.pdf",
      summary: "Master index of every document in this room",
      tags: ["Board pack"],
      starred: true,
    },
  ],
  tree: [
    {
      name: "01 Corporate",
      files: [
        {
          name: "Certificate of incorporation.pdf",
          summary: "Delaware certificate, filed 2019",
          tags: ["Signed"],
        },
        {
          name: "Cap table (post Series A).pdf",
          summary: "Fully diluted ownership as of Q2",
          tags: ["Confidential"],
          starred: true,
        },
        { name: "Bylaws (amended).pdf", summary: "Amended and restated bylaws", tags: ["Signed"] },
      ],
      children: [
        {
          name: "Board minutes",
          files: [
            { name: "2024-11 Board minutes.pdf", summary: "November board meeting", tags: ["Board pack"] },
            { name: "2025-02 Board minutes.pdf", summary: "February board meeting", tags: ["Board pack"] },
            { name: "2025-05 Board minutes.pdf", summary: "May board meeting", tags: ["Board pack", "Needs review"] },
          ],
        },
      ],
    },
    {
      name: "02 Financials",
      files: [
        {
          name: "Audited statements FY2024.pdf",
          summary: "Independent auditor's report and statements",
          tags: ["Confidential"],
          starred: true,
        },
        { name: "Management accounts Q1.pdf", summary: "Unaudited management accounts", tags: [] },
        { name: "Management accounts Q2.pdf", summary: "Unaudited management accounts", tags: ["Needs review"] },
        { name: "Revenue by cohort.pdf", summary: "Net revenue retention by signup cohort", tags: ["Confidential"] },
      ],
      children: [
        {
          name: "Model",
          files: [
            { name: "Operating model v7.pdf", summary: "Three-year operating plan", tags: ["Needs review"] },
            { name: "Headcount plan.pdf", summary: "Hiring plan through FY2026", tags: [] },
          ],
        },
      ],
    },
    {
      name: "03 Commercial",
      files: [
        { name: "Top 20 customer contracts.pdf", summary: "Executed MSAs for the largest accounts", tags: ["Confidential", "Signed"] },
        { name: "Standard MSA template.pdf", summary: "Current form of master services agreement", tags: [] },
        { name: "Reseller agreements.pdf", summary: "Channel partner agreements", tags: ["Signed"] },
      ],
    },
    {
      name: "04 People",
      files: [
        { name: "Key employment agreements.pdf", summary: "Founders and executive team", tags: ["Confidential"] },
        { name: "Equity plan documents.pdf", summary: "2019 stock plan and amendments", tags: ["Signed"] },
        { name: "Org chart.pdf", summary: "Current reporting structure", tags: [] },
      ],
    },
    {
      name: "05 Legal & IP",
      files: [
        { name: "Registered trademarks.pdf", summary: "Trademark register across jurisdictions", tags: ["Signed"] },
        { name: "Open source inventory.pdf", summary: "Dependency licences and obligations", tags: ["Needs review"] },
        { name: "Data processing agreements.pdf", summary: "Sub-processor DPAs", tags: ["Confidential"] },
        { name: "Litigation summary.pdf", summary: "No material pending litigation", tags: [] },
      ],
    },
  ],
};
