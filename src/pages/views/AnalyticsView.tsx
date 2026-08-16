import { useOutletContext } from "react-router-dom";
import { Download, Eye, PieChart, Upload, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { ActivityTimeline } from "@/components/charts/ActivityTimeline";
import { RankedBars } from "@/components/charts/RankedBars";
import { Sparkline } from "@/components/charts/Sparkline";
import { ActivityFeed } from "@/features/activity/ActivityFeed";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useShareLinks } from "@/hooks/useShareLinks";
import { useDataStore } from "@/store/dataStore";
import { formatRelative } from "@/lib/format";
import { expiryLabel, isActive } from "@/lib/share";
import type { DataroomOutletContext } from "@/pages/types";

export default function AnalyticsView() {
  const { dataroom, previewFile } = useOutletContext<DataroomOutletContext>();
  const summary = useAnalytics(14);
  const { links } = useShareLinks();
  const filesById = useDataStore((s) => s.filesById);

  const viewSeries = summary.timeline.map((day) => day.views);
  const downloadSeries = summary.timeline.map((day) => day.downloads);
  const uploadSeries = summary.timeline.map((day) => day.uploads);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 pl-12 sm:px-6 md:pl-6">
        <PageHeader
          icon={PieChart}
          title="Analytics"
          description={`Engagement across ${dataroom.name} over the last 14 days.`}
        />

        <div className="grid gap-3 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Views" value={summary.totalViews} icon={Eye} accent="indigo">
            <Sparkline values={viewSeries} label="Views over the last 14 days" />
          </StatCard>
          <StatCard label="Downloads" value={summary.totalDownloads} icon={Download} accent="amber">
            <Sparkline values={downloadSeries} label="Downloads over the last 14 days" />
          </StatCard>
          <StatCard label="Uploads" value={summary.totalUploads} icon={Upload} accent="emerald">
            <Sparkline values={uploadSeries} label="Uploads over the last 14 days" />
          </StatCard>
          <StatCard
            label="Link visitors"
            value={summary.uniqueViewers}
            icon={Users}
            accent="violet"
            hint={
              summary.busiestDay
                ? `Busiest day: ${summary.busiestDay.label}`
                : "No share traffic yet"
            }
          />
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard
            title="Daily activity"
            description="Views, downloads and uploads per day."
          >
            <ActivityTimeline data={summary.timeline} />
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Most engaged documents"
              description="Ranked by views plus downloads."
            >
              <RankedBars
                items={summary.topFiles.map((file) => ({
                  id: file.fileId,
                  label: file.name,
                  value: file.views + file.downloads,
                  secondary: file.lastViewedAt
                    ? `last seen ${formatRelative(file.lastViewedAt)}`
                    : undefined,
                }))}
                valueLabel="events"
                emptyMessage="Open a document to start collecting engagement data."
                onSelect={(fileId) => {
                  const file = filesById[fileId];
                  if (file) previewFile(file);
                }}
              />
            </SectionCard>

            <SectionCard
              title="Share links"
              description="How the links you handed out are being used."
            >
              {links.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No links created yet.
                </p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {links.slice(0, 6).map((link) => (
                    <li key={link.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{expiryLabel(link)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={isActive(link) ? "success" : "outline"}>
                          {isActive(link) ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-sm tabular">{link.viewCount}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Latest activity" description="The most recent eight events.">
            <ActivityFeed
              events={summary.recentEvents}
              filter="all"
              limit={8}
              emptyMessage="Upload or open a document to start the log."
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
