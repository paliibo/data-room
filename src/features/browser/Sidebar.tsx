import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  Check,
  ChevronsUpDown,
  Clock,
  Files,
  Link2,
  ListChecks,
  Moon,
  PieChart,
  Plus,
  Search,
  Star,
  Sun,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Kbd } from "@/components/shared/Kbd";
import { useDatarooms } from "@/hooks/useDatarooms";
import { useDataroomStats, useTrashCount } from "@/hooks/useFolderContents";
import { useChecklist } from "@/hooks/useChecklist";
import { useShareLinks } from "@/hooks/useShareLinks";
import { useTheme } from "@/hooks/useTheme";
import { accentVars } from "@/lib/accent";
import { FolderTree } from "./FolderTree";
import { StorageMeter } from "./StorageMeter";
import type { SidebarProps } from "@/features/browser/types";

function NavItem({
  to,
  end,
  icon: Icon,
  label,
  badge,
}: {
  to: string;
  end?: boolean;
  icon: typeof Files;
  label: string;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
          isActive
            ? "bg-accent font-medium text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )
      }
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="outline" className="ml-auto h-5 px-1.5 tabular">
          {badge}
        </Badge>
      )}
    </NavLink>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </p>
  );
}

export function Sidebar({
  dataroom,
  activeFolderId,
  scope,
  onNavigate,
  onMoveItem,
  onCreateDataroom,
  onOpenCommandPalette,
}: SidebarProps) {
  const navigate = useNavigate();
  const { datarooms } = useDatarooms();
  const { theme, toggleTheme } = useTheme();
  const stats = useDataroomStats();
  const trashCount = useTrashCount();
  const { counts } = useChecklist();
  const { activeCount } = useShareLinks();
  const base = `/d/${dataroom.id}`;
  const openRequests = counts.requested + counts["in-review"];

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-sidebar">
      <div className="p-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start gap-2.5 px-2 py-2"
              aria-label={`Current dataroom: ${dataroom.name}. Switch dataroom`}
              style={accentVars(dataroom.accent)}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-tint text-white">
                <Files className="size-4" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span className="w-full truncate text-sm font-semibold leading-none">
                  {dataroom.name}
                </span>
                <span className="text-[11px] font-normal leading-none text-muted-foreground">
                  {stats.fileCount} docs · {stats.activeShares} active links
                </span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Switch dataroom</DropdownMenuLabel>
            {datarooms.map((room) => (
              <DropdownMenuItem key={room.id} onSelect={() => navigate(`/d/${room.id}`)}>
                <span
                  className="size-2 shrink-0 rounded-full bg-tint"
                  style={accentVars(room.accent)}
                  aria-hidden
                />
                <span className="truncate">{room.name}</span>
                {room.id === dataroom.id && <Check className="ml-auto" aria-hidden />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/")}>
              All datarooms
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCreateDataroom}>
              <Plus aria-hidden />
              New dataroom
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="mt-1.5 flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border bg-card px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          <Search className="size-3.5" aria-hidden />
          Search
          <Kbd keys="mod+k" className="ml-auto" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
        <nav aria-label="Views" className="flex flex-col gap-0.5">
          <NavItem to={base} end icon={Files} label="All files" />
          <NavItem to={`${base}/starred`} icon={Star} label="Starred" />
          <NavItem to={`${base}/recent`} icon={Clock} label="Recent" />
          <NavItem to={`${base}/trash`} icon={Trash2} label="Trash" badge={trashCount} />
        </nav>

        <SectionLabel>Deal room</SectionLabel>
        <nav aria-label="Deal room" className="flex flex-col gap-0.5">
          <NavItem
            to={`${base}/checklist`}
            icon={ListChecks}
            label="Checklist"
            badge={openRequests}
          />
          <NavItem to={`${base}/shares`} icon={Link2} label="Share links" badge={activeCount} />
          <NavItem to={`${base}/activity`} icon={Activity} label="Activity" />
          <NavItem to={`${base}/analytics`} icon={PieChart} label="Analytics" />
        </nav>

        <SectionLabel>Folders</SectionLabel>
        <FolderTree
          activeFolderId={activeFolderId}
          isFolderScope={scope === "folder"}
          onNavigate={onNavigate}
          onMoveItem={onMoveItem}
        />
      </div>

      <Separator />
      <StorageMeter fileCount={stats.fileCount} totalSize={stats.totalSize} />
      <Separator />
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-[11px] text-muted-foreground">Stored on this device</p>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </Button>
      </div>
    </aside>
  );
}
