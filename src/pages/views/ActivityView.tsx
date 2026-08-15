import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { Activity, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { ActivityFeed } from "@/features/activity/ActivityFeed";
import { useDataStore } from "@/store/dataStore";
import type { ActivityFilter } from "@/features/activity/types";
import type { DataroomOutletContext } from "@/pages/types";

const TABS: { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "documents", label: "Documents" },
  { value: "sharing", label: "Sharing" },
  { value: "structure", label: "Structure" },
];

export default function ActivityView() {
  const { dataroom } = useOutletContext<DataroomOutletContext>();
  const activity = useDataStore((s) => s.activity);
  const clearActivity = useDataStore((s) => s.clearActivity);
  const [filter, setFilter] = useState<ActivityFilter>("all");

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 pl-12 sm:px-6 md:pl-6">
        <PageHeader
          icon={Activity}
          title="Activity"
          description={`Every action taken in ${dataroom.name}, newest first.`}
          actions={
            activity.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearActivity()
                    .then(() => toast.success("Activity log cleared"))
                    .catch(() => toast.error("Couldn't clear the log"));
                }}
              >
                <Eraser aria-hidden />
                Clear log
              </Button>
            )
          }
        />

        <div className="py-5">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as ActivityFilter)}>
            <TabsList>
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <ActivityFeed events={activity} filter={filter} limit={200} />
      </div>
    </div>
  );
}
