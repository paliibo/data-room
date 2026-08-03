import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDataStore } from "@/store/dataStore";
import { isActive } from "@/lib/share";
import type { ShareLink } from "@/types";

export function useShareLinks(): { links: ShareLink[]; activeCount: number } {
  const { sharesById, shareIds } = useDataStore(
    useShallow((s) => ({ sharesById: s.sharesById, shareIds: s.shareIds })),
  );

  return useMemo(() => {
    const links = shareIds.map((id) => sharesById[id]).filter(Boolean);
    return { links, activeCount: links.filter((link) => isActive(link)).length };
  }, [shareIds, sharesById]);
}
