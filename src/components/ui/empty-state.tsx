import { cn } from "@/lib/utils/cn";

import type { EmptyStateProps } from "./empty-state.types";

/**
 * Empty list or page (E02-T03), illustration-free as the design system asks:
 * an icon, one sentence and at most one action, centered.
 */
export function EmptyState({
  icon,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 px-4 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-surface text-muted-foreground">
        {icon}
      </span>
      <p className="max-w-xs text-base text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
