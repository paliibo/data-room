import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TagChip } from "@/components/shared/TagChip";
import { useDataStore } from "@/store/dataStore";
import { useTags } from "@/hooks/useTags";
import { ACCENTS, ACCENT_LABELS, accentVars } from "@/lib/accent";
import type { AccentColor } from "@/types";
import type { TagEditorDialogProps } from "@/features/tags/types";

/**
 * Tag assignment and tag creation in one place, because the moment you need a
 * tag that does not exist yet is while you are tagging something.
 */
export function TagEditorDialog({ file, onOpenChange }: TagEditorDialogProps) {
  const tags = useTags();
  const { createTag, setFileTags } = useDataStore(
    useShallow((s) => ({ createTag: s.createTag, setFileTags: s.setFileTags })),
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<AccentColor>("indigo");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (file) {
      setSelected(file.tagIds);
      setNewName("");
    }
  }, [file]);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
    );

  const addTag = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const tag = await createTag(name, newColor);
      setSelected((current) => [...current, tag.id]);
      setNewName("");
    } catch (error) {
      toast.error("Couldn't create the tag", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const save = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      await setFileTags(file.id, selected);
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't save tags", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(file)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tags</DialogTitle>
          <DialogDescription className="truncate">{file?.name}</DialogDescription>
        </DialogHeader>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const active = selected.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  aria-pressed={active}
                  className="cursor-pointer rounded-full transition-transform active:scale-95"
                >
                  <TagChip
                    tag={tag}
                    className={active ? "ring-2 ring-tint ring-offset-1 ring-offset-card" : "opacity-60"}
                  />
                </button>
              );
            })}
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="tag-name">New tag</Label>
          <div className="flex gap-2">
            <Input
              id="tag-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="e.g. Confidential"
              autoComplete="off"
            />
            <Button type="button" variant="outline" size="icon" onClick={addTag} aria-label="Create tag">
              <Plus aria-hidden />
            </Button>
          </div>
          <div role="radiogroup" aria-label="Tag colour" className="flex gap-1.5 pt-1">
            {ACCENTS.map((accent) => (
              <button
                key={accent}
                type="button"
                role="radio"
                aria-checked={newColor === accent}
                aria-label={ACCENT_LABELS[accent]}
                onClick={() => setNewColor(accent)}
                style={accentVars(accent)}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full bg-tint text-white transition-transform hover:scale-110"
              >
                {newColor === accent && <Check className="size-3.5" aria-hidden />}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="brand" onClick={save} disabled={isSaving}>
            {isSaving && <Loader2 className="animate-spin" aria-hidden />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
