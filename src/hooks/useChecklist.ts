import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDataStore } from "@/store/dataStore";
import type { ChecklistItem, ChecklistStatus } from "@/types";

export interface ChecklistProgress {
  items: ChecklistItem[];
  byCategory: { category: string; items: ChecklistItem[] }[];
  counts: Record<ChecklistStatus, number>;
  percentComplete: number;
}

export function useChecklist(): ChecklistProgress {
  const { checklistById, checklistIds } = useDataStore(
    useShallow((s) => ({
      checklistById: s.checklistById,
      checklistIds: s.checklistIds,
    })),
  );

  return useMemo(() => {
    const items = checklistIds.map((id) => checklistById[id]).filter(Boolean);
    const counts: Record<ChecklistStatus, number> = {
      requested: 0,
      "in-review": 0,
      complete: 0,
    };
    const groups = new Map<string, ChecklistItem[]>();

    for (const item of items) {
      counts[item.status]++;
      const bucket = groups.get(item.category) ?? [];
      bucket.push(item);
      groups.set(item.category, bucket);
    }

    return {
      items,
      byCategory: [...groups.entries()]
        .map(([category, groupItems]) => ({ category, items: groupItems }))
        .sort((a, b) => a.category.localeCompare(b.category)),
      counts,
      percentComplete:
        items.length === 0 ? 0 : Math.round((counts.complete / items.length) * 100),
    };
  }, [checklistIds, checklistById]);
}
