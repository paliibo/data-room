import {
  Ban,
  Download,
  Eye,
  FolderOpen,
  KeyRound,
  Layers,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopyField } from "./CopyField";
import { expiryLabel, isActive, shareUrl } from "@/lib/share";
import { formatRelative } from "@/lib/format";
import type { ShareLinkCardProps } from "@/features/share/types";

export function ShareLinkCard({ link, folderName, onRevoke, onDelete }: ShareLinkCardProps) {
  const live = isActive(link);

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 elevate-1 transition-opacity",
        !live && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium" title={link.label}>
            {link.label}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {folderName ? (
              <>
                <FolderOpen className="size-3.5" aria-hidden />
                {folderName}
              </>
            ) : (
              <>
                <Layers className="size-3.5" aria-hidden />
                Whole dataroom
              </>
            )}
            <span aria-hidden>·</span>
            created {formatRelative(link.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={live ? "success" : "outline"}>
            {live ? "Active" : link.revokedAt ? "Revoked" : "Expired"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${link.label}`}>
                <Ban aria-hidden className="rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {live && (
                <DropdownMenuItem onSelect={() => onRevoke(link.id)}>
                  <Ban />
                  Revoke access
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDelete(link.id)}
              >
                <Trash2 className="text-destructive" />
                Delete link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{expiryLabel(link)}</Badge>
        {link.passcode && (
          <Badge variant="outline">
            <KeyRound aria-hidden />
            Passcode
          </Badge>
        )}
        <Badge variant="outline">
          <Download aria-hidden />
          {link.allowDownload ? "Downloads on" : "View only"}
        </Badge>
        {link.watermark && <Badge variant="outline">Watermarked</Badge>}
        <Badge variant="outline">
          <Eye aria-hidden />
          {link.viewCount} {link.viewCount === 1 ? "view" : "views"}
        </Badge>
      </div>

      {live && <CopyField value={shareUrl(link.token)} label={`link for ${link.label}`} />}
    </li>
  );
}
