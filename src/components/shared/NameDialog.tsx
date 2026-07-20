import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { renameFormSchema, type RenameFormValues } from "@/lib/validation";
import { NameConflictError } from "@/store/utils";
import type { NameDialogProps } from "@/components/shared/types";

export function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  label = "Name",
  placeholder,
  initialValue = "",
  submitLabel,
  onSubmit,
}: NameDialogProps) {
  const form = useForm<RenameFormValues>({
    resolver: zodResolver(renameFormSchema),
    defaultValues: { name: initialValue },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: initialValue });
    }
  }, [open, initialValue, form]);

  const handleSubmit = form.handleSubmit(async ({ name }) => {
    try {
      await onSubmit(name);
      onOpenChange(false);
    } catch (error) {
      form.setError("name", {
        message:
          error instanceof NameConflictError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Something went wrong",
      });
    }
  });

  const errorMessage = form.formState.errors.name?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const input = (event.currentTarget as HTMLElement | null)?.querySelector("input");
          input?.focus();
          input?.select();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entity-name" className="sr-only">
              {label}
            </Label>
            <Input
              id="entity-name"
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? "entity-name-error" : undefined}
              {...form.register("name")}
            />
            {errorMessage && (
              <p id="entity-name-error" role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="animate-spin" aria-hidden />
              )}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
