import { HardDrive } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStorageEstimate } from "@/hooks/useStorageEstimate";
import { formatBytes } from "@/lib/format";
import { accentVars } from "@/lib/accent";
import type { StorageMeterProps } from "@/features/browser/types";

/**
 * Browser quota, not app quota — everything lives in IndexedDB, so this is the
 * honest ceiling. Hidden entirely where the Storage API is unavailable.
 */
export function StorageMeter({ fileCount, totalSize }: StorageMeterProps) {
  const estimate = useStorageEstimate(fileCount);

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2" style={accentVars("indigo")}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <HardDrive className="size-3.5" aria-hidden />
          {fileCount} {fileCount === 1 ? "document" : "documents"}
        </span>
        <span className="text-muted-foreground tabular">{formatBytes(totalSize)}</span>
      </div>
      {estimate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Progress
                value={estimate.percent}
                aria-label="Browser storage used"
                className="h-1"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {formatBytes(estimate.used)} of {formatBytes(estimate.quota)} browser
            storage used
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
