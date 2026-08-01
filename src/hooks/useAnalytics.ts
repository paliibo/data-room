import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDataStore } from "@/store/dataStore";
import { summarize } from "@/lib/analytics";
import type { AnalyticsSummary } from "@/hooks/types";

export function useAnalytics(days = 14): AnalyticsSummary {
  const { activity, filesById } = useDataStore(
    useShallow((s) => ({ activity: s.activity, filesById: s.filesById })),
  );
  return useMemo(() => summarize(activity, filesById, days), [activity, filesById, days]);
}
