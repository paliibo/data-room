import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Loader2, ShieldCheck } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useDataStore } from "@/store/dataStore";
import { shareUrl } from "@/lib/share";
import { CopyField } from "./CopyField";
import { EXPIRY_OPTIONS, type ShareDialogProps } from "@/features/share/types";

/**
 * Creating a link is the moment the policy is decided, so every control that
 * governs access lives here rather than being editable after the fact — a link
 * whose rules can change under the recipient is a link nobody can reason about.
 */
export function ShareDialog({
  open,
  onOpenChange,
  folderId,
  folder,
  dataroomName,
}: ShareDialogProps) {
  const createShareLink = useDataStore((s) => s.createShareLink);

  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | null>(30);
  const [passcode, setPasscode] = useState("");
  const [allowDownload, setAllowDownload] = useState(true);
  const [watermark, setWatermark] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scopeName = folder?.name ?? dataroomName;

  useEffect(() => {
    if (!open) return;
    setLabel("");
    setExpiresInDays(30);
    setPasscode("");
    setAllowDownload(true);
    setWatermark(false);
    setCreated(null);
    setIsSubmitting(false);
  }, [open]);

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const link = await createShareLink({
        label: label.trim() || `${scopeName} access`,
        folderId,
        expiresInDays,
        passcode: passcode.trim() || null,
        allowDownload,
        watermark,
      });
      setCreated(shareUrl(link.token));
      toast.success("Share link created");
    } catch (error) {
      toast.error("Couldn't create the link", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-4 text-brand" aria-hidden />
            {created ? "Link ready" : "Share access"}
          </DialogTitle>
          <DialogDescription>
            {created
              ? "Anyone with this link can open the shared documents under the rules you set."
              : `Give read access to ${folder ? `the "${scopeName}" folder` : `all of ${scopeName}`}.`}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <CopyField value={created} label="share link" />
            <div className="flex items-start gap-2.5 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <p>
                This demo stores everything in your browser, so the link only opens
                on this device. In a hosted deployment the same policy would be
                enforced server-side.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-label">Label</Label>
              <Input
                id="share-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={`e.g. ${scopeName} — buy-side counsel`}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Shown in the activity log whenever this link is opened.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Expires</Label>
              <div role="radiogroup" aria-label="Link expiry" className="flex flex-wrap gap-2">
                {EXPIRY_OPTIONS.map((option) => (
                  <Button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={expiresInDays === option.value}
                    variant={expiresInDays === option.value ? "soft" : "outline"}
                    size="sm"
                    onClick={() => setExpiresInDays(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-passcode">Passcode (optional)</Label>
              <Input
                id="share-passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Leave empty for no passcode"
                autoComplete="off"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="share-download">Allow downloads</Label>
                <p className="text-xs text-muted-foreground">
                  Off means view-only — the download button is not rendered.
                </p>
              </div>
              <Switch
                id="share-download"
                checked={allowDownload}
                onCheckedChange={setAllowDownload}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="share-watermark">Watermark preview</Label>
                <p className="text-xs text-muted-foreground">
                  Overlays the recipient's link label across the document.
                </p>
              </div>
              <Switch id="share-watermark" checked={watermark} onCheckedChange={setWatermark} />
            </div>
          </div>
        )}

        <DialogFooter>
          {created ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="brand" onClick={submit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                Create link
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
