import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityFeed } from "@/features/activity/ActivityFeed";
import type { ActivityEvent, ActivityType } from "@/types";

let seq = 0;
const event = (
  type: ActivityType,
  targetName: string,
  overrides: Partial<ActivityEvent> = {},
): ActivityEvent => ({
  id: `e${++seq}`,
  dataroomId: "room-1",
  type,
  actor: "You",
  targetId: null,
  targetName,
  detail: "",
  at: new Date().toISOString(),
  ...overrides,
});

describe("<ActivityFeed />", () => {
  it("renders an empty state when nothing matches", () => {
    render(<ActivityFeed events={[]} filter="all" />);
    expect(screen.getByText("No activity")).toBeInTheDocument();
  });

  it("renders actor, verb and target for an event", () => {
    render(<ActivityFeed events={[event("file.upload", "Cap table.pdf")]} filter="all" />);
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("uploaded")).toBeInTheDocument();
    expect(screen.getByText("Cap table.pdf")).toBeInTheDocument();
  });

  it("groups events under a day heading", () => {
    render(<ActivityFeed events={[event("file.view", "A.pdf")]} filter="all" />);
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
  });

  it("hides events the active filter excludes", () => {
    render(
      <ActivityFeed
        events={[event("share.create", "Counsel link"), event("file.upload", "A.pdf")]}
        filter="sharing"
      />,
    );
    expect(screen.getByText("Counsel link")).toBeInTheDocument();
    expect(screen.queryByText("A.pdf")).not.toBeInTheDocument();
  });

  it("respects the limit", () => {
    const events = Array.from({ length: 5 }, (_, i) => event("file.view", `Doc ${i}.pdf`));
    render(<ActivityFeed events={events} filter="all" limit={2} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("exposes a machine-readable timestamp for each event", () => {
    const at = "2026-01-15T09:00:00.000Z";
    const { container } = render(
      <ActivityFeed events={[event("file.view", "A.pdf", { at })]} filter="all" />,
    );
    expect(container.querySelector("time")).toHaveAttribute("datetime", at);
  });
});
