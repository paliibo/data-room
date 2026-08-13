import { useLocation } from "react-router-dom";
import type { BrowseScope } from "@/types";

const SCOPES: BrowseScope[] = ["starred", "recent", "trash"];

/** Derives the browse scope from the URL so views survive refresh and back. */
export function useBrowseScope(): BrowseScope {
  const { pathname } = useLocation();
  const last = pathname.split("/").filter(Boolean).pop();
  return SCOPES.find((scope) => scope === last) ?? "folder";
}
