# Dataroom

A virtual **Data Room** MVP — a secure, organized workspace for storing and
browsing due-diligence documents, in the spirit of Google Drive / Dropbox /
Box. Built as a frontend-only SPA: everything (including PDF binaries)
persists locally in IndexedDB, so the app works end-to-end with zero backend.

<p align="center">
  <em>React · TypeScript · Vite · TailwindCSS · shadcn/ui · Zustand · Zod ·
  React Hook Form · React Router · React Dropzone · Framer Motion</em>
</p>

## Features

**Datarooms** — create, rename, delete (cascade), switch between rooms.

**Folders** — unlimited nesting, create / rename / delete (recursive),
collapsible sidebar tree that auto-expands along the active path.

**Files (PDF)** — drag & drop upload anywhere on the page (or file picker),
inline preview with metadata (size, upload date, original filename, MIME
type), rename, download, delete.

**Organizing** — drag & drop files *and* folders onto folders, tree nodes or
breadcrumbs to move them; grid/list views; sort by name / date / size;
instant search within a dataroom.

**Polish** — dark mode (system-aware, persisted, no flash on load), toasts
for every action, confirmation dialogs for destructive actions, context
menus, keyboard shortcuts, loading skeletons, empty states, error states,
responsive layout with a mobile slide-over sidebar.

### Keyboard shortcuts

| Key | Action |
| --- | ------ |
| `N` | New folder |
| `U` | Upload PDFs |
| `/` | Focus search |
| `G` | Toggle grid / list |
| `Enter` | Open selected folder / preview selected file |
| `F2` | Rename selected item |
| `Delete` | Delete selected item |
| `Esc` | Clear selection / close dialog |

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
npm run lint     # oxlint
```

Requires Node 20+.

## Architecture

The code is layered so that UI, state and persistence can each change
independently:

```
pages / features / components   (rendering)
  └── hooks                     (business logic)
        └── store (Zustand)     (state + actions)
              └── repositories  (CRUD API)
                    └── indexedDb (storage)
```

- **Repositories** (`src/storage/repositories/`) are the only code that
  touches IndexedDB. Swapping IndexedDB for an HTTP API means reimplementing
  three small files — no store or component changes.
- **The data store** (`src/store/dataStore.ts`) is a normalized client-side
  database: flat `byId` maps plus a `childrenByParent` index, exactly as you
  would shape a server cache. No recursive nested state.
- **Hooks** (`src/hooks/`) adapt store state to view needs (`useFolderTree`
  flattens the visible tree rows, `useBreadcrumbs` walks parent pointers,
  `useFolderContents` applies search + sort) and own side-effect flows
  (`useUpload`).
- **Components** are presentational; the route component (`DataroomPage`)
  wires navigation, dialogs and actions together and passes callbacks down.

### Data model

```ts
Dataroom { id, name, createdAt, updatedAt }
Folder   { id, dataroomId, parentId, name, createdAt, updatedAt }
FileItem { id, dataroomId, parentId, name, originalFilename,
           size, mimeType, uploadedAt, updatedAt }        // metadata only
```

`parentId: null` means "directly in the dataroom root". File **binary
content lives in a separate `blobs` object store**, keyed by file id, so
listing a folder never deserializes megabytes of PDF bytes.

### Why these choices

| Decision | Rationale |
| -------- | --------- |
| **Normalized state** (`byId` + children index) instead of a nested tree | Renaming a deeply nested folder is one O(1) map write; the folder tree renders from cheap lookups; no recursive immutable updates. Scales to thousands of entries. |
| **Only the active dataroom is hydrated** | A dataroom is the unit of interest. Memory stays proportional to what is on screen; switching rooms re-hydrates from IndexedDB. |
| **IndexedDB over localStorage** | Blob support (PDFs up to 200 MB), async API, indexes (`by-dataroom`) for O(subset) hydration and deletion, transactions for atomic cascade deletes. |
| **Cascade deletes inside one transaction** | A crash mid-delete can never leave orphaned folders/files/blobs. |
| **Zustand (two stores)** | `dataStore` = domain data; `uiStore` = view prefs (view mode, sort, tree expansion — persisted to localStorage, harmless to lose). Clean separation of concerns without Redux ceremony. |
| **Validation in the store, not the form** | Name conflicts are business rules; dialogs just surface `NameConflictError` as a field error. The same rule guards uploads, renames and drag-moves. |
| **Native browser PDF viewer (iframe + blob URL)** | Zero-dependency, lazy-loaded route chunk, familiar UX (zoom/print/save built in). `pdf.js` would add ~400 kB for little MVP gain — an easy later swap since the viewer is one component. |
| **Duplicate names: block vs. auto-suffix** | Explicit create/rename **blocks** with an inline error (user intent is clear). Uploads **auto-suffix** `report (2).pdf` like Drive/Finder (failing a 10-file drop over one collision is hostile). Comparison is case-insensitive. |
| **Flat rendering of the folder tree** | `useFolderTree` flattens visible rows (collapsed branches skipped), so rows are memoized siblings rather than a recursive component pyramid — and the list is trivially virtualizable if trees grow huge. |

### Edge cases handled

- Duplicate folder/file/dataroom names (case-insensitive; block or auto-suffix as above)
- Invalid names (empty, `/ \ : * ? " < > |`, control chars, trailing dots, >255 chars) via Zod
- Non-PDF uploads and empty files → per-file rejection toasts; oversized files (>200 MB) rejected
- Recursive deletion of deep trees, atomically, including blobs
- Deleting the folder you are standing in (or an ancestor) → navigates to the deleted folder's parent first
- URL pointing at a deleted/unknown folder or dataroom → graceful fallback + toast
- Moving a folder into its own subtree → blocked (cycle guard); move collisions auto-renamed
- Corrupted / unavailable IndexedDB (private mode, disk full) → error state with retry and "reset local data"
- State survives refresh; stale hydration responses are ignored when switching rooms quickly
- Breadcrumb/ancestor walks guard against corrupt parent cycles

## Project structure

```
src/
  components/
    ui/          # shadcn/ui primitives (button, dialog, menus, …)
    shared/      # EmptyState, NameDialog, DeleteConfirmDialog, ErrorBoundary
  features/
    browser/     # Sidebar, FolderTree, FolderNode, Breadcrumbs, Toolbar,
                 # ContentView, ItemCard, ItemRow, ItemContextMenu, UploadDropzone
    preview/     # PdfPreviewDialog + lazy PdfViewer
  hooks/         # useDatarooms, useFolderContents, useFolderTree,
                 # useBreadcrumbs, useUpload, useKeyboardShortcuts, useTheme
  store/         # dataStore (domain), uiStore (view prefs)
  storage/       # indexedDb.ts + repositories/
  lib/           # validation (Zod), dnd, format, download, utils
  pages/         # DataroomListPage, DataroomPage (route orchestrators)
  types/         # domain models
```

Each feature folder follows one convention: component files contain only
components; their prop interfaces and local types live in a sibling
`types.ts`, and non-React helpers in a sibling `utils.ts` (e.g.
`features/browser/types.ts` + `features/browser/utils.ts`, and the same
pattern in `components/shared`, `features/preview`, `pages`, `hooks` and
`store`). `components/ui` is intentionally exempt — those files are vendored
shadcn/ui primitives kept in their upstream single-file form so they can be
diffed/updated against the generator.

## Accessibility

Radix primitives give dialogs/menus focus trapping, escape handling and
ARIA roles for free; on top of that: `role="tree"/"treeitem"` with
`aria-expanded`/`aria-selected` in the sidebar, labeled icon buttons,
`aria-current` breadcrumbs, keyboard-operable cards (Tab + Enter), visible
focus rings, and form errors announced via `role="alert"`.

## Tradeoffs & future improvements

- **No backend** (per brief). Next step: swap repositories for an API client
  + blob storage (S3 presigned uploads), keeping stores/components intact.
- **Single selection** only; multi-select with shift/cmd and bulk actions
  would follow the same `ItemActions` interface.
- **Search is name-based** within the open dataroom; full-text PDF search
  would need a worker + pdf.js text extraction.
- **No virtualization yet** — content renders comfortably into the hundreds
  of items; `useFolderTree`'s flat output makes adding `react-virtual`
  straightforward when needed.
- **No auth/sharing** — a real dataroom needs permissions, watermarking and
  audit logs; out of scope for a local-only MVP.
- Undo (trash bin) instead of hard delete; favorites & recents; file
  thumbnails via pdf.js page-1 rasterization.
