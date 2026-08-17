import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Download,
  Eye,
  FileText,
  Folder as FolderIcon,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { PdfPreviewDialog } from "@/features/preview/PdfPreviewDialog";
import { useDataStore } from "@/store/dataStore";
import { DENIAL_COPY, evaluateShare, type ShareAccess } from "@/lib/share";
import { ShareLinkRepository } from "@/storage/repositories/ShareLinkRepository";
import { DataroomRepository } from "@/storage/repositories/DataroomRepository";
import { FolderRepository } from "@/storage/repositories/FolderRepository";
import { FileRepository } from "@/storage/repositories/FileRepository";
import { downloadFile } from "@/lib/download";
import { formatBytes, formatDate } from "@/lib/format";
import { parentKey } from "@/store/utils";
import { toast } from "sonner";
import type { Dataroom, FileItem, Folder } from "@/types";

interface ShareContents {
  dataroom: Dataroom;
  folders: Folder[];
  files: FileItem[];
}

/**
 * The recipient's view. It deliberately loads through the repositories rather
 * than the dataroom store: a visitor is not the owner, gets no sidebar, no
 * mutations and no audit access — only what the link's policy allows.
 */
export default function SharePage() {
  const { token = "" } = useParams();
  const registerShareView = useDataStore((s) => s.registerShareView);

  const [access, setAccess] = useState<ShareAccess | null>(null);
  const [contents, setContents] = useState<ShareContents | null>(null);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    ShareLinkRepository.getByToken(token)
      .then((link) => {
        if (cancelled) return;
        setAccess(evaluateShare(link, null));
      })
      .catch(() => {
        if (!cancelled) setAccess({ status: "denied", reason: "not-found" });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const link = access?.status !== "denied" ? access?.link : undefined;
  const granted = access?.status === "granted";

  useEffect(() => {
    if (!granted || !link) return;
    let cancelled = false;

    Promise.all([
      DataroomRepository.get(link.dataroomId),
      FolderRepository.getByDataroom(link.dataroomId),
      FileRepository.getByDataroom(link.dataroomId),
    ])
      .then(([dataroom, folders, files]) => {
        if (cancelled || !dataroom) return;
        setContents({
          dataroom,
          folders: folders.filter((f) => !f.deletedAt),
          files: files.filter((f) => !f.deletedAt),
        });
        setOpenFolderId(link.folderId);
      })
      .catch(() => undefined);

    registerShareView(link.token).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [granted, link, registerShareView]);

  const submitPasscode = useCallback(async () => {
    const stored = await ShareLinkRepository.getByToken(token);
    const result = evaluateShare(stored, passcode.trim());
    if (result.status === "passcode-required") {
      setPasscodeError(true);
      return;
    }
    setPasscodeError(false);
    setAccess(result);
  }, [token, passcode]);

  /** Only the shared subtree is reachable — the link's scope is the root here. */
  const visible = useMemo(() => {
    if (!contents || !link) return { folders: [], files: [] };
    const key = parentKey(openFolderId);
    const byParent = (parentId: string | null) => parentKey(parentId) === key;
    return {
      folders: contents.folders
        .filter((f) => byParent(f.parentId))
        .sort((a, b) => a.name.localeCompare(b.name)),
      files: contents.files
        .filter((f) => byParent(f.parentId))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [contents, link, openFolderId]);

  if (!access) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (access.status === "denied") {
    const copy = DENIAL_COPY[access.reason];
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <EmptyState
          icon={ShieldAlert}
          title={copy.title}
          description={copy.body}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  if (access.status === "passcode-required") {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-6 elevate-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <KeyRound className="size-5" aria-hidden />
          </span>
          <h1 className="mt-4 text-lg font-semibold">This room is passcode protected</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the passcode you were given to open “{access.link.label}”.
          </p>
          <form
            className="mt-5 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitPasscode();
            }}
          >
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setPasscodeError(false);
              }}
              autoComplete="off"
              aria-invalid={passcodeError}
              aria-describedby={passcodeError ? "passcode-error" : undefined}
            />
            {passcodeError && (
              <p id="passcode-error" role="alert" className="text-sm text-destructive">
                That passcode does not match.
              </p>
            )}
            <Button type="submit" variant="brand" className="w-full">
              Open dataroom
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const rootFolder = link?.folderId
    ? contents?.folders.find((f) => f.id === link.folderId)
    : null;
  const isAtRoot = openFolderId === (link?.folderId ?? null);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <Lock className="size-4" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">
                {contents?.dataroom.name ?? "Shared dataroom"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Shared as “{link?.label}”
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">
              <Eye aria-hidden />
              Read only
            </Badge>
            {link?.allowDownload ? (
              <Badge variant="outline">
                <Download aria-hidden />
                Downloads allowed
              </Badge>
            ) : (
              <Badge variant="warning">No downloads</Badge>
            )}
            {link?.watermark && <Badge variant="outline">Watermarked</Badge>}
            {link?.expiresAt && (
              <Badge variant="outline">Expires {formatDate(link.expiresAt)}</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-7">
        {!isAtRoot && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-3"
            onClick={() => {
              const current = contents?.folders.find((f) => f.id === openFolderId);
              setOpenFolderId(current?.parentId ?? link?.folderId ?? null);
            }}
          >
            ← Back
          </Button>
        )}

        <h1 className="text-lg font-semibold">
          {openFolderId
            ? contents?.folders.find((f) => f.id === openFolderId)?.name
            : rootFolder?.name ?? contents?.dataroom.name}
        </h1>

        {visible.folders.length === 0 && visible.files.length === 0 ? (
          <div className="pt-6">
            <EmptyState
              compact
              icon={FolderIcon}
              title="Nothing here"
              description="This folder has no documents."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y rounded-xl border bg-card elevate-1">
            {visible.folders.map((folder) => (
              <li key={folder.id}>
                <button
                  type="button"
                  onClick={() => setOpenFolderId(folder.id)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60"
                >
                  <FolderIcon className="size-4.5 shrink-0 text-brand" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {folder.name}
                  </span>
                  <span className="text-xs text-muted-foreground">Folder</span>
                </button>
              </li>
            ))}
            {visible.files.map((file) => (
              <li key={file.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setPreviewFile(file)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                >
                  <FileText className="size-4.5 shrink-0 text-destructive/70" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular">
                    {formatBytes(file.size)}
                  </span>
                </button>
                {link?.allowDownload && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Download ${file.name}`}
                    onClick={() => {
                      downloadFile(file.id, file.name).catch(() =>
                        toast.error("Download failed"),
                      );
                    }}
                  >
                    <Download aria-hidden />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          This link is read-only. Access can be revoked by the owner at any time.
        </p>
      </main>

      <PdfPreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        readOnly
        watermark={link?.watermark ? link.label : null}
        allowDownload={link?.allowDownload ?? false}
      />
    </div>
  );
}
