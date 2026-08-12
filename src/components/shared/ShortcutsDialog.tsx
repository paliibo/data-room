import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/shared/Kbd";

const GROUPS: { title: string; shortcuts: { keys: string; label: string }[] }[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: "mod+k", label: "Open the command palette" },
      { keys: "/", label: "Focus the filter box" },
      { keys: "enter", label: "Open folder or preview file" },
      { keys: "esc", label: "Clear selection or close a dialog" },
    ],
  },
  {
    title: "Documents",
    shortcuts: [
      { keys: "u", label: "Upload PDFs" },
      { keys: "n", label: "New folder" },
      { keys: "s", label: "Star or unstar the selection" },
      { keys: "f2", label: "Rename the selection" },
      { keys: "delete", label: "Move the selection to trash" },
      { keys: "mod+a", label: "Select everything in view" },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { keys: "g", label: "Toggle grid and list" },
      { keys: "mod+shift+s", label: "Create a share link" },
      { keys: "?", label: "Show this help" },
    ],
  },
];

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Single-key shortcuts are ignored while you are typing.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <section key={group.title} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h3>
              <dl className="space-y-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center justify-between gap-3">
                    <dt className="text-sm text-muted-foreground">{shortcut.label}</dt>
                    <dd>
                      <Kbd keys={shortcut.keys} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
