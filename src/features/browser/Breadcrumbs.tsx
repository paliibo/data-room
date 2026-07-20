import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { getDragPayload, isItemDrag } from "@/lib/dnd";
import type { BreadcrumbsProps } from "@/features/browser/types";

export function Breadcrumbs({ folderId, onNavigate, onMoveItem }: BreadcrumbsProps) {
  const crumbs = useBreadcrumbs(folderId);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.id ?? "root"}>
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              )}
              <li className="min-w-0">
                {isLast ? (
                  <span
                    aria-current="page"
                    className="block max-w-56 truncate font-semibold"
                    title={crumb.name}
                  >
                    {crumb.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate(crumb.id)}
                    onDragOver={(e) => {
                      if (isItemDrag(e)) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDrop={(e) => {
                      const payload = getDragPayload(e);
                      if (payload) {
                        e.preventDefault();
                        onMoveItem(payload, crumb.id);
                      }
                    }}
                    className={cn(
                      "block max-w-40 cursor-pointer truncate rounded px-1 py-0.5 text-muted-foreground transition-colors",
                      "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                    title={crumb.name}
                  >
                    {crumb.name}
                  </button>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
