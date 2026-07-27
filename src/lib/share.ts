import type { ShareLink } from "@/types";

export type ShareDenialReason = "not-found" | "revoked" | "expired";

export type ShareAccess =
  | { status: "granted"; link: ShareLink }
  | { status: "passcode-required"; link: ShareLink }
  | { status: "denied"; reason: ShareDenialReason };

/** URL-safe token; short enough to paste, wide enough to not be guessable by hand. */
export function createShareToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

export function shareUrl(token: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}s/${token}`.replace(
    /([^:])\/\/+/g,
    "$1/",
  );
}

export function isExpired(link: ShareLink, at: Date = new Date()): boolean {
  return link.expiresAt !== null && Date.parse(link.expiresAt) <= at.getTime();
}

export function isActive(link: ShareLink, at: Date = new Date()): boolean {
  return link.revokedAt === null && !isExpired(link, at);
}

/**
 * The single place that decides whether a visitor may see a shared room. Kept
 * pure so the rules are unit-testable and identical everywhere they are applied.
 */
export function evaluateShare(
  link: ShareLink | undefined,
  suppliedPasscode: string | null,
  at: Date = new Date(),
): ShareAccess {
  if (!link) return { status: "denied", reason: "not-found" };
  if (link.revokedAt !== null) return { status: "denied", reason: "revoked" };
  if (isExpired(link, at)) return { status: "denied", reason: "expired" };
  if (link.passcode !== null && link.passcode !== suppliedPasscode) {
    return { status: "passcode-required", link };
  }
  return { status: "granted", link };
}

export const DENIAL_COPY: Record<ShareDenialReason, { title: string; body: string }> = {
  "not-found": {
    title: "This link doesn't exist",
    body: "Check the address, or ask whoever shared it for a new link.",
  },
  revoked: {
    title: "This link was revoked",
    body: "The owner turned off access. Request a fresh link to continue.",
  },
  expired: {
    title: "This link has expired",
    body: "Share links stop working on their expiry date. Ask for a new one.",
  },
};

export function expiryLabel(link: ShareLink, at: Date = new Date()): string {
  if (link.revokedAt) return "Revoked";
  if (!link.expiresAt) return "Never expires";
  const remaining = Date.parse(link.expiresAt) - at.getTime();
  if (remaining <= 0) return "Expired";
  const days = Math.ceil(remaining / 86_400_000);
  if (days === 1) return "Expires today";
  return `Expires in ${days} days`;
}
