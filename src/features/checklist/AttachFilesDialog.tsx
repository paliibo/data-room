import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useDataStore } from "@/store/dataStore";
import { formatBytes } from "@/lib/format";
import type { AttachFilesDialogProps } from "@/features/checklist/types";

/** Links uploaded documents to a request — how the room proves it was answered. */
export function AttachFilesDialog({ item, onOpenChange, onSave }: AttachFilesDialogProps) {
  const filesById = useDataStore((s) => s.filesById);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setSelected(item.fileIds);
      setQuery("");
    }
  }, [item]);

  const files = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return Object.values(filesById)
      .filter((file) => !file.deletedAt)
      .filter((file) => !needle || file.name.toLocaleLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filesById, query]);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
    );

  const save = async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      await onSave(item.id, selected);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link documents</DialogTitle>
          <DialogDescription>
            Attach the uploads that answer “{item?.title}”.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            aria-label="Search documents"
            className="pl-8"
          />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border">
          {files.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No documents match.
            </p>
          ) : (
            <ul className="divide-y">
              {files.map((file) => (
                <li key={file.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-accent/60">
                    <Checkbox
                      checked={selected.includes(file.id)}
                      onCheckedChange={() => toggle(file.id)}
                    />
                    <FileText className="size-4 shrink-0 text-destructive/70" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular">
                      {formatBytes(file.size)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="brand" onClick={save} disabled={isSaving}>
            {isSaving && <Loader2 className="animate-spin" aria-hidden />}
            Save {selected.length > 0 && `(${selected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
