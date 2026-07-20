import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, FolderLock, Moon, Plus, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useDatarooms } from "@/hooks/useDatarooms";
import { useTheme } from "@/hooks/useTheme";
import { FolderTree } from "./FolderTree";
import type { SidebarProps } from "@/features/browser/types";

export function Sidebar({
  dataroom,
  activeFolderId,
  onNavigate,
  onMoveItem,
  onCreateDataroom,
}: SidebarProps) {
  const navigate = useNavigate();
  const { datarooms } = useDatarooms();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-sidebar">
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start gap-2 px-2 py-2"
              aria-label={`Current dataroom: ${dataroom.name}. Switch dataroom`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                <FolderLock className="h-4 w-4" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start">
                <span className="w-full truncate text-sm font-semibold">
                  {dataroom.name}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  Dataroom
                </span>
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch dataroom</DropdownMenuLabel>
            {datarooms.map((room) => (
              <DropdownMenuItem
                key={room.id}
                onSelect={() => navigate(`/d/${room.id}`)}
              >
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
      </div>
      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        <FolderTree
          activeFolderId={activeFolderId}
          onNavigate={onNavigate}
          onMoveItem={onMoveItem}
        />
      </div>

      <Separator />
      <div className="flex items-center justify-between p-3">
        <p className="text-xs text-muted-foreground">Stored locally</p>
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
