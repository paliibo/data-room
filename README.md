<div align="center">

# Vault

**A virtual data room that runs entirely in your browser.**

Organize due-diligence documents, hand out links that expire,
and see exactly which documents got read.

[![CI](https://github.com/paliibo/data-room/actions/workflows/ci.yml/badge.svg)](https://github.com/paliibo/data-room/actions/workflows/ci.yml)
[![Deploy](https://github.com/paliibo/data-room/actions/workflows/deploy.yml/badge.svg)](https://github.com/paliibo/data-room/actions/workflows/deploy.yml)

**[→ Open the live demo](https://paliibo.github.io/data-room/)**

React 19 · TypeScript · Vite · Tailwind v4 · Zustand · IndexedDB · Vitest

</div>

---

A **data room** is the private workspace a company opens up during a
fundraise or an acquisition: one place for the financials, the contracts and
the cap table, shared with the other side's lawyers and bankers under tight
control. The three jobs that define one are **organize**, **control access**,
and **prove who saw what** — and this project does all three with no backend
at all. Documents, PDF bytes, share-link policy and the full audit history
live in IndexedDB, so the app works end to end offline and nothing ever
leaves the device.

> **Try it:** open the [live demo](https://paliibo.github.io/data-room/) and
> press **Load the example deal**. It generates a
> populated Series B diligence room — 23 documents across five sections, tags,
> a request checklist, live and revoked share links, and two weeks of reading
> history so the analytics dashboard has something real to show.

## Features

### Organize

- **Datarooms** — one workspace per deal, each with its own accent colour, description and history.
- **Folders** — unlimited nesting, drag-and-drop onto tree nodes, breadcrumbs or cards, with a cycle guard that stops a folder being moved into itself.
- **Documents** — drag-and-drop PDF upload anywhere on the page, inline preview, rename, per-file notes.
- **Tags** — colour-coded labels with live counts and multi-tag filtering.
- **Smart views** — Starred, Recent and Trash are routes, not view state, so they survive a refresh and a pasted link.
- **Multi-select** — click, shift-click for a range, ⌘-click to toggle, ⌘A for everything in view; then star, export or trash the lot.
- **Export** — download a single file, or a whole folder as a ZIP that keeps its structure.

### Control access

- **Share links** scoped to the whole room or a single folder.
- **Expiry** (7 / 30 / 90 days or never), an optional **passcode**, a **download** switch, and a **watermark** that stamps the recipient's link label across every preview.
- **Revocable** at any time; revoked and expired links keep their history instead of vanishing.
- A **public recipient view** at `/s/:token` with no sidebar, no mutations and no audit access — only what the policy allows.

### Prove

- **Audit log** — every action recorded with actor, target and time, grouped by day and filterable by category.
- **Analytics** — views, downloads, uploads and unique link visitors; a 14-day stacked timeline; the most-engaged documents; per-link traffic.
- **Due-diligence checklist** — the requests the other side made, each carrying the documents that answer it, with a completion ring over the whole list.

### Craft

Command palette (<kbd>⌘K</kbd>) searching the whole room · undoable delete ·
dark mode with no flash on load · a full keyboard map · storage-quota meter ·
loading skeletons, empty states and error states for every surface · a
responsive layout with a mobile slide-over sidebar.

### Keyboard

| Key | Action | | Key | Action |
| --- | ------ |-| --- | ------ |
| <kbd>⌘K</kbd> | Command palette | | <kbd>S</kbd> | Star / unstar |
| <kbd>/</kbd> | Focus the filter | | <kbd>F2</kbd> | Rename |
| <kbd>N</kbd> | New folder | | <kbd>⌫</kbd> | Move to trash |
| <kbd>U</kbd> | Upload PDFs | | <kbd>⌘A</kbd> | Select all in view |
| <kbd>G</kbd> | Grid / list | | <kbd>⌘⇧S</kbd> | Create share link |
| <kbd>↵</kbd> | Open or preview | | <kbd>?</kbd> | Shortcut help |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run check      # lint + typecheck + tests, the same gate CI runs
```

| Script | What it does |
| ------ | ------------ |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck and production build |
| `npm run test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Coverage summary for `lib`, `store`, `hooks`, `storage` |
| `npm run lint` | oxlint |
| `npm run check` | All of the above, in CI order |

Requires Node 20+.

## Architecture

Five layers, each replaceable without touching the ones above it:

```
pages / features / components     rendering
  └── hooks                       view logic and side effects
        └── store (Zustand)       normalized state + actions
              └── repositories    the CRUD API
                    └── indexedDb storage
```

**Repositories** (`src/storage/repositories/`) are the only code that touches
IndexedDB. Swapping local storage for an HTTP API means reimplementing six
small files — no store or component changes.

**The data store** (`src/store/`) is a normalized client-side database: flat
`byId` maps plus a `childrenByParent` index, shaped exactly like a server
cache. It is assembled from six slices — tree, trash, tags, sharing, audit,
checklist — so each domain reads on its own while sharing one `get()`/`set()`.

**Hooks** (`src/hooks/`) adapt store state to view needs. `useFolderContents`
serves all four browse scopes from one predicate, `useFolderTree` flattens
visible tree rows, `useAnalytics` aggregates the audit log.

**Selection lives in its own store.** It changes on every click, and keeping
it out of the persisted UI store stops a shift-click sweep from re-serializing
localStorage on each step.

### Data model

```ts
Dataroom     { id, name, description, accent, createdAt, updatedAt }
Folder       { id, dataroomId, parentId, name, starred, deletedAt, … }
FileItem     { id, dataroomId, parentId, name, size, mimeType,
               starred, deletedAt, tagIds, note, uploadedAt, … }   // metadata only
Tag          { id, dataroomId, name, color }
ShareLink    { id, dataroomId, token, folderId, expiresAt, passcode,
               allowDownload, watermark, revokedAt, viewCount, … }
ActivityEvent{ id, dataroomId, type, actor, targetId, targetName, detail, at }
ChecklistItem{ id, dataroomId, title, category, status, fileIds, … }
```

`parentId: null` means "directly in the dataroom root". File **bytes live in a
separate `blobs` store** keyed by file id, so listing a folder never
deserializes megabytes of PDF.

### Why these choices

| Decision | Rationale |
| -------- | --------- |
| **Normalized state** (`byId` + children index) instead of a nested tree | Renaming a deeply nested folder is one O(1) map write; the tree renders from cheap lookups. No recursive immutable updates. |
| **Store split into slices** | Six domains share one `get()`/`set()` without one 900-line file. Trash can call `logActivity` directly instead of routing through a bus. |
| **Soft delete, not hard delete** | Trashing stamps `deletedAt` across the subtree and leaves rows in place, so restore is a field flip and undo costs nothing. Purging is the only thing that drops rows and blobs. |
| **Trash lists only subtree roots** | Deleting one folder with 40 files should be one entry to restore, not 41. |
| **Only the active dataroom is hydrated** | A room is the unit of interest. Memory stays proportional to what is on screen; switching re-hydrates from IndexedDB, and stale responses from a fast switch are discarded. |
| **IndexedDB over localStorage** | Blob support (PDFs to 200 MB), async API, `by-dataroom` indexes for O(subset) reads, and transactions for atomic cascade deletes. |
| **Schema upgrades are additive; rows normalize on read** | A v1 database keeps every row and only gains new stores. Defaulting the new fields at the repository boundary means a large existing room never pays a rewrite before it can open. |
| **Share policy is one pure function** | `evaluateShare` is the single place that decides granted / passcode-required / denied, so the public route and the owner's link list agree by construction — and the rules are directly testable. |
| **Every mutation logs to one audit trail** | Analytics aggregates the log rather than keeping a second set of counters, so the dashboard cannot drift from what actually happened. |
| **Routes are scope-first** | `/starred`, `/recent`, `/trash` and `/analytics` are addresses, not component state — so every view survives a refresh, a back press and a pasted link. |
| **Native PDF viewer (iframe + blob URL)** | Zero dependencies, lazily loaded, and it brings zoom, search and print for free. `pdf.js` would add ~400 kB for little gain, and the viewer is one component if that changes. |
| **Duplicate names: block vs. auto-suffix** | An explicit create or rename **blocks** with an inline error — the intent is unambiguous. An upload **auto-suffixes** `report (2).pdf`, because failing a ten-file drop over one collision is hostile. |
| **Chart colours validated, not eyeballed** | The three series were checked for colour-vision separation against each theme's own surface — light clears a worst-pair ΔE of 10.1, dark 8.2 — rather than dark mode being an automatic flip of light. |

### Edge cases handled

- Duplicate names (case-insensitive) — blocked on create/rename, auto-suffixed on upload; a trashed item stops reserving its name
- Invalid names (empty, `/ \ : * ? " < > |`, control chars, trailing dots, > 255 chars) via Zod
- Non-PDF, empty and oversized (> 200 MB) uploads rejected per file, so the rest of a batch still lands
- Recursive delete and restore of deep trees, atomically, including blobs
- Deleting the folder you are standing in, or one of its ancestors → navigates to the deleted folder's parent first
- A URL pointing at a deleted or unknown folder, dataroom or share token → graceful fallback
- Moving a folder into its own subtree → blocked; move collisions auto-renamed
- Corrupt parent cycles → breadcrumbs, ancestor walks and subtree collection all terminate instead of hanging
- Corrupted or unavailable IndexedDB (private mode, disk full) → error state with retry and "reset local data"
- Fast room switching → stale hydration responses are discarded
- Expired, revoked and passcode-protected links → each with its own recipient-facing explanation
- Backdated audit events → the feed re-sorts rather than assuming every batch is newest

## Testing

123 tests over the layers where correctness is not visual:

```bash
npm run test
```

- **`src/lib`** — share-link policy, name validation and uniqueness, analytics aggregation
- **`src/store`** — tree helpers and cycle guards, plus an end-to-end suite driving the real store against a fake IndexedDB, so cascade deletes, transactions and blob cleanup are genuinely exercised rather than mocked
- **`src/features`** — palette search ranking, activity filtering and grouping, and a rendered feed

## Project structure

```
src/
  components/
    ui/          shadcn/ui primitives (button, dialog, command, …)
    shared/      PageHeader, StatCard, SectionCard, TagChip, Kbd, EmptyState
    charts/      ActivityTimeline, Sparkline, RankedBars, ProgressRing
  features/
    browser/     Sidebar, FolderTree, Toolbar, ContentView, cards, rows, bulk bar
    command/     ⌘K palette and its dataroom-wide search
    share/       link creation dialog, policy badges, copy field
    activity/    audit feed, verbs, day grouping
    checklist/   request rows, document attachment
    tags/        tag editor
    preview/     PdfPreviewDialog + lazy PdfViewer
    demo/        example dataset, PDF generator, seeded history
  hooks/         scoped contents, analytics, tags, shares, checklist, shortcuts
  store/         dataStore (six slices), uiStore, selection store
  storage/       indexedDb.ts, normalize.ts, repositories/
  lib/           validation, share policy, analytics, download, dnd, format
  pages/         landing, dataroom layout, routed views, public share, 404
  test/          setup and factories
```

Each feature folder follows one convention: component files contain only
components, their prop types live in a sibling `types.ts`, and non-React
helpers in a sibling `utils.ts`. `components/ui` is exempt — those are
vendored shadcn/ui primitives kept in upstream single-file form so they can be
diffed against the generator.

## Accessibility

Radix primitives supply focus trapping, escape handling and ARIA roles for
dialogs and menus. On top of that: `role="tree"`/`treeitem` with
`aria-expanded` and `aria-selected` in the sidebar, `aria-current`
breadcrumbs, labeled icon buttons, keyboard-operable cards, a visible focus
ring on every interactive element, form errors announced through
`role="alert"`, charts that carry a text summary and a live hover readout
rather than relying on colour, and a `prefers-reduced-motion` escape hatch.

## Deployment

Pushing to `main` builds and publishes to GitHub Pages. The base path is
injected at build time and read back by the router, and the built shell is
copied to `404.html` so a static host hands deep links back to the SPA instead
of returning a real 404.

## Limitations

Being backend-free is the point, and it has honest consequences:

- **Share links only open on the device that created them.** The policy engine
  is real, but the data lives in that browser's IndexedDB. A hosted deployment
  would move `evaluateShare` server-side unchanged.
- **View-only is a UX signal, not DRM.** The viewer chrome is hidden and
  previews are watermarked; anyone determined can still reach the bytes. That
  is exactly why real data rooms watermark rather than rely on blocking.
- **No auth, no roles, no server-side audit.** Single-user by construction.
- **Search matches names, not PDF contents.** Full-text would need pdf.js text
  extraction in a worker.
- **No list virtualization yet.** Content renders comfortably into the
  hundreds; `useFolderTree`'s flat output makes adding it straightforward.

## Next steps

Swap the repositories for an API client with S3 presigned uploads (stores and
components stay as they are) · per-recipient share analytics with page-level
dwell time · full-text PDF search · row virtualization · a real permissions
model with roles and per-folder grants.

---

<div align="center">
Built by <a href="https://github.com/paliibo">paliibo</a>
</div>
