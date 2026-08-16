import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { ListChecks, Plus, Sparkles } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { ChecklistRow } from "@/features/checklist/ChecklistRow";
import { AttachFilesDialog } from "@/features/checklist/AttachFilesDialog";
import { STARTER_REQUESTS, STATUS_META } from "@/features/checklist/types";
import { useChecklist } from "@/hooks/useChecklist";
import { useDataStore } from "@/store/dataStore";
import type { DataroomOutletContext } from "@/pages/types";
import type { ChecklistItem, ChecklistStatus } from "@/types";

export default function ChecklistView() {
  const { previewFile } = useOutletContext<DataroomOutletContext>();
  const { byCategory, counts, percentComplete, items } = useChecklist();
  const filesById = useDataStore((s) => s.filesById);
  const { createChecklistItem, updateChecklistItem, deleteChecklistItem, seedChecklist } =
    useDataStore(
      useShallow((s) => ({
        createChecklistItem: s.createChecklistItem,
        updateChecklistItem: s.updateChecklistItem,
        deleteChecklistItem: s.deleteChecklistItem,
        seedChecklist: s.seedChecklist,
      })),
    );

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [attachTo, setAttachTo] = useState<ChecklistItem | null>(null);

  const addRequest = async () => {
    if (!title.trim()) return;
    try {
      await createChecklistItem(title, category || "General");
      setTitle("");
      toast.success("Request added");
    } catch (error) {
      toast.error("Couldn't add the request", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 pl-12 sm:px-6 md:pl-6">
        <PageHeader
          icon={ListChecks}
          title="Due-diligence checklist"
          description="What the other side asked for, and the documents that answer it."
          actions={
            items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  seedChecklist(STARTER_REQUESTS)
                    .then(() => toast.success("Standard requests added"))
                    .catch(() => toast.error("Couldn't add the requests"));
                }}
              >
                <Sparkles aria-hidden />
                Add standard set
              </Button>
            )
          }
        />

        {items.length === 0 ? (
          <div className="pt-6">
            <EmptyState
              icon={ListChecks}
              title="No requests yet"
              description="Start from the standard first-round diligence list, or add your own requests one at a time."
              action={
                <Button
                  variant="brand"
                  onClick={() => {
                    seedChecklist(STARTER_REQUESTS)
                      .then(() => toast.success("Added 14 standard requests"))
                      .catch(() => toast.error("Couldn't add the requests"));
                  }}
                >
                  <Sparkles aria-hidden />
                  Use the standard list
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 pt-5 lg:grid-cols-[1fr_16rem]">
            <div className="order-2 flex flex-col gap-4 lg:order-1">
              {byCategory.map((group) => (
                <SectionCard
                  key={group.category}
                  title={group.category}
                  actions={
                    <Badge variant="outline">
                      {group.items.filter((i) => i.status === "complete").length}/
                      {group.items.length}
                    </Badge>
                  }
                >
                  <ul className="flex flex-col gap-2">
                    {group.items.map((item) => (
                      <ChecklistRow
                        key={item.id}
                        item={item}
                        files={item.fileIds
                          .map((id) => filesById[id])
                          .filter((file) => file && !file.deletedAt)}
                        onStatusChange={(itemId, status) => {
                          updateChecklistItem(itemId, { status }).catch(() =>
                            toast.error("Couldn't update the request"),
                          );
                        }}
                        onAttach={setAttachTo}
                        onDelete={(itemId) => {
                          deleteChecklistItem(itemId).catch(() =>
                            toast.error("Couldn't remove the request"),
                          );
                        }}
                        onOpenFile={previewFile}
                      />
                    ))}
                  </ul>
                </SectionCard>
              ))}

              <SectionCard title="Add a request">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="request-title">Request</Label>
                    <Input
                      id="request-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRequest();
                        }
                      }}
                      placeholder="e.g. Insurance certificates"
                    />
                  </div>
                  <div className="space-y-1.5 sm:w-40">
                    <Label htmlFor="request-category">Category</Label>
                    <Input
                      id="request-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="General"
                    />
                  </div>
                  <Button variant="brand" onClick={addRequest}>
                    <Plus aria-hidden />
                    Add
                  </Button>
                </div>
              </SectionCard>
            </div>

            <aside className="order-1 flex flex-col gap-4 lg:order-2">
              <div className="rounded-xl border bg-card p-5 elevate-1">
                <ProgressRing
                  percent={percentComplete}
                  label="Requests fulfilled"
                  sublabel={`${counts.complete} of ${items.length}`}
                />
                <ul className="mt-4 space-y-2">
                  {(Object.keys(STATUS_META) as ChecklistStatus[]).map((status) => (
                    <li key={status} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        <Badge variant={STATUS_META[status].badge}>
                          {STATUS_META[status].label}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground tabular">{counts[status]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>

      <AttachFilesDialog
        item={attachTo}
        onOpenChange={(open) => !open && setAttachTo(null)}
        onSave={async (itemId, fileIds) => {
          await updateChecklistItem(itemId, {
            fileIds,
            // Attaching evidence is what moves a request out of "requested".
            status: fileIds.length > 0 ? "in-review" : "requested",
          });
          toast.success(fileIds.length > 0 ? "Documents linked" : "Documents cleared");
        }}
      />
    </div>
  );
}
