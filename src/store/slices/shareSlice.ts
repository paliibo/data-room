import type { StateCreator } from "zustand";
import type { ShareLink } from "@/types";
import { createId } from "@/lib/utils";
import { createShareToken } from "@/lib/share";
import { ShareLinkRepository } from "@/storage/repositories/ShareLinkRepository";
import type { DataState, ShareSlice } from "@/store/types";
import { now } from "@/store/utils";

const DAY_MS = 86_400_000;

export const createShareSlice: StateCreator<DataState, [], [], ShareSlice> = (
  set,
  get,
) => ({
  sharesById: {},
  shareIds: [],

  async createShareLink(draft) {
    const state = get();
    const dataroomId = state.activeDataroomId;
    if (!dataroomId) throw new Error("No dataroom is open");

    const link: ShareLink = {
      id: createId(),
      dataroomId,
      token: createShareToken(),
      label: draft.label.trim() || "Untitled link",
      folderId: draft.folderId,
      expiresAt:
        draft.expiresInDays === null
          ? null
          : new Date(Date.now() + draft.expiresInDays * DAY_MS).toISOString(),
      passcode: draft.passcode?.trim() || null,
      allowDownload: draft.allowDownload,
      watermark: draft.watermark,
      revokedAt: null,
      viewCount: 0,
      lastViewedAt: null,
      createdAt: now(),
    };

    await ShareLinkRepository.put(link);
    set((s) => ({
      sharesById: { ...s.sharesById, [link.id]: link },
      shareIds: [link.id, ...s.shareIds],
    }));
    await get().logActivity({
      type: "share.create",
      targetId: link.id,
      targetName: link.label,
      detail: draft.folderId
        ? `scoped to ${state.foldersById[draft.folderId]?.name ?? "a folder"}`
        : "whole dataroom",
    });
    return link;
  },

  async revokeShareLink(linkId) {
    const link = get().sharesById[linkId];
    if (!link || link.revokedAt) return;
    const updated: ShareLink = { ...link, revokedAt: now() };
    await ShareLinkRepository.put(updated);
    set((s) => ({ sharesById: { ...s.sharesById, [linkId]: updated } }));
    await get().logActivity({
      type: "share.revoke",
      targetId: linkId,
      targetName: link.label,
    });
  },

  async deleteShareLink(linkId) {
    if (!get().sharesById[linkId]) return;
    await ShareLinkRepository.delete(linkId);
    set((s) => {
      const { [linkId]: _removed, ...sharesById } = s.sharesById;
      return { sharesById, shareIds: s.shareIds.filter((id) => id !== linkId) };
    });
  },

  /**
   * Called from the public viewer, which has no room loaded. The counter is
   * written straight through the repository and only mirrored into state when
   * the owner happens to have that room open.
   */
  async registerShareView(token) {
    const link = await ShareLinkRepository.getByToken(token);
    if (!link) return;
    const updated: ShareLink = {
      ...link,
      viewCount: link.viewCount + 1,
      lastViewedAt: now(),
    };
    await ShareLinkRepository.put(updated);
    if (get().activeDataroomId === link.dataroomId) {
      set((s) => ({ sharesById: { ...s.sharesById, [link.id]: updated } }));
      // The actor is the link label, so naming the room as the target avoids
      // "Buy-side counsel opened Buy-side counsel".
      await get().logActivity({
        type: "share.view",
        actor: link.label,
        targetId: link.id,
        targetName: get().dataroomsById[link.dataroomId]?.name ?? "the dataroom",
      });
    }
  },
});
