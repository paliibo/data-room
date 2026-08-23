import { describe, expect, it } from "vitest";
import { evaluateShare, expiryLabel, isActive, isExpired } from "@/lib/share";
import { makeShareLink } from "@/test/factories";

const AT = new Date("2026-01-15T12:00:00.000Z");

describe("evaluateShare", () => {
  it("denies an unknown token", () => {
    expect(evaluateShare(undefined, null, AT)).toEqual({
      status: "denied",
      reason: "not-found",
    });
  });

  it("denies a revoked link even before its expiry", () => {
    const link = makeShareLink({
      revokedAt: "2026-01-14T00:00:00.000Z",
      expiresAt: "2026-02-01T00:00:00.000Z",
    });
    expect(evaluateShare(link, null, AT)).toEqual({ status: "denied", reason: "revoked" });
  });

  it("denies an expired link", () => {
    const link = makeShareLink({ expiresAt: "2026-01-14T00:00:00.000Z" });
    expect(evaluateShare(link, null, AT)).toEqual({ status: "denied", reason: "expired" });
  });

  it("treats the expiry instant itself as expired", () => {
    const link = makeShareLink({ expiresAt: AT.toISOString() });
    expect(evaluateShare(link, null, AT)).toEqual({ status: "denied", reason: "expired" });
  });

  it("grants an open link with no passcode", () => {
    const link = makeShareLink();
    expect(evaluateShare(link, null, AT)).toEqual({ status: "granted", link });
  });

  it("asks for a passcode before granting", () => {
    const link = makeShareLink({ passcode: "atlas" });
    expect(evaluateShare(link, null, AT).status).toBe("passcode-required");
    expect(evaluateShare(link, "wrong", AT).status).toBe("passcode-required");
    expect(evaluateShare(link, "atlas", AT).status).toBe("granted");
  });

  it("checks revocation and expiry before the passcode", () => {
    // A correct passcode must not resurrect a link the owner already killed.
    const link = makeShareLink({ passcode: "atlas", revokedAt: "2026-01-01T00:00:00.000Z" });
    expect(evaluateShare(link, "atlas", AT)).toEqual({ status: "denied", reason: "revoked" });
  });
});

describe("isExpired / isActive", () => {
  it("treats a null expiry as never expiring", () => {
    expect(isExpired(makeShareLink({ expiresAt: null }), AT)).toBe(false);
    expect(isActive(makeShareLink({ expiresAt: null }), AT)).toBe(true);
  });

  it("is inactive once revoked", () => {
    expect(isActive(makeShareLink({ revokedAt: "2026-01-01T00:00:00.000Z" }), AT)).toBe(false);
  });
});

describe("expiryLabel", () => {
  it("reports revocation ahead of expiry", () => {
    const link = makeShareLink({
      revokedAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-03-01T00:00:00.000Z",
    });
    expect(expiryLabel(link, AT)).toBe("Revoked");
  });

  it("counts whole days remaining", () => {
    expect(expiryLabel(makeShareLink({ expiresAt: "2026-01-25T12:00:00.000Z" }), AT)).toBe(
      "Expires in 10 days",
    );
  });

  it("collapses the final day to today", () => {
    expect(expiryLabel(makeShareLink({ expiresAt: "2026-01-15T20:00:00.000Z" }), AT)).toBe(
      "Expires today",
    );
  });

  it("says never for an open-ended link", () => {
    expect(expiryLabel(makeShareLink({ expiresAt: null }), AT)).toBe("Never expires");
  });
});
