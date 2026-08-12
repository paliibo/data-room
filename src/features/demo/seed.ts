import { useDataStore } from "@/store/dataStore";
import { STARTER_REQUESTS } from "@/features/checklist/types";
import { DEMO_DATASET, type DemoFolder } from "@/features/demo/dataset";
import { createSamplePdf } from "@/features/demo/pdf";
import type { Dataroom } from "@/types";

/**
 * Populates a full example dataroom so the app has something to show on a first
 * visit. Everything goes through the normal store actions rather than writing to
 * IndexedDB directly, so the seeded room is indistinguishable from a real one —
 * including its activity log.
 */
export async function seedDemoDataroom(): Promise<Dataroom> {
  const store = useDataStore.getState();
  const room = await store.createDataroom(
    DEMO_DATASET.name,
    DEMO_DATASET.description,
    DEMO_DATASET.accent,
  );
  await useDataStore.getState().openDataroom(room.id);

  const tagIds = new Map<string, string>();
  for (const tag of DEMO_DATASET.tags) {
    const created = await useDataStore.getState().createTag(tag.name, tag.color);
    tagIds.set(tag.name, created.id);
  }

  const uploadInto = async (parentId: string | null, files: DemoFolder["files"]) => {
    if (files.length === 0) return;
    const blobs = files.map(
      (file) =>
        new File([createSamplePdf(file.name.replace(/\.pdf$/i, ""), file.summary)], file.name, {
          type: "application/pdf",
        }),
    );
    const { uploaded } = await useDataStore.getState().uploadFiles(parentId, blobs);

    for (const [index, item] of uploaded.entries()) {
      const spec = files[index];
      if (!spec) continue;
      const ids = spec.tags.map((name) => tagIds.get(name)).filter((id): id is string => Boolean(id));
      if (ids.length > 0) await useDataStore.getState().setFileTags(item.id, ids);
      if (spec.starred) await useDataStore.getState().toggleStar("file", item.id);
    }
  };

  const build = async (folders: DemoFolder[], parentId: string | null) => {
    for (const spec of folders) {
      const folder = await useDataStore.getState().createFolder(parentId, spec.name);
      await uploadInto(folder.id, spec.files);
      if (spec.children) await build(spec.children, folder.id);
    }
  };

  await uploadInto(null, DEMO_DATASET.rootFiles);
  await build(DEMO_DATASET.tree, null);
  await useDataStore.getState().seedChecklist(STARTER_REQUESTS);

  // One live link and one revoked one, so the shares view has both states.
  const active = await useDataStore.getState().createShareLink({
    label: "Buy-side counsel — read only",
    folderId: null,
    expiresInDays: 30,
    passcode: null,
    allowDownload: false,
    watermark: true,
  });
  const revoked = await useDataStore.getState().createShareLink({
    label: "Former advisor",
    folderId: null,
    expiresInDays: 7,
    passcode: null,
    allowDownload: true,
    watermark: false,
  });
  await useDataStore.getState().revokeShareLink(revoked.id);
  await useDataStore.getState().registerShareView(active.token);

  return room;
}

/** True when the browser has no datarooms at all — the first-run condition. */
export function isFirstRun(): boolean {
  return useDataStore.getState().dataroomIds.length === 0;
}
