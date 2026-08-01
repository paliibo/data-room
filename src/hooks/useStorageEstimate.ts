import { useCallback, useEffect, useState } from "react";
import { estimateUsage } from "@/storage/indexedDb";
import type { StorageEstimate } from "@/hooks/types";

/**
 * Browser quota for the usage meter. Returns null where the Storage API is
 * unavailable (Safari private mode, older browsers) so callers can hide the
 * meter rather than render a misleading zero.
 */
export function useStorageEstimate(watch: unknown): StorageEstimate | null {
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);

  const refresh = useCallback(() => {
    let cancelled = false;
    estimateUsage()
      .then((result) => {
        if (cancelled || !result) return;
        setEstimate({
          ...result,
          percent: Math.min(100, (result.used / result.quota) * 100),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(refresh, [refresh, watch]);

  return estimate;
}
