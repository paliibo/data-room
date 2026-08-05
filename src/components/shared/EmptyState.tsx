import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { EmptyStateProps } from "@/components/shared/types";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        compact
          ? "py-10"
          : "grid-backdrop rounded-2xl border border-dashed px-6 py-16",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl border bg-card elevate-1">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}
