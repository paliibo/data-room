import { accentVars } from "@/lib/accent";
import type { StatCardProps } from "@/components/shared/types";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "indigo",
  children,
}: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 elevate-1"
      style={accentVars(accent)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <span className="flex size-7 items-center justify-center rounded-lg bg-tint-soft text-tint">
            <Icon className="size-3.5" aria-hidden />
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold leading-none tabular">{value}</p>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
