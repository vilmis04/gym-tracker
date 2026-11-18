import { type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeVariant =
  "neutral" | "primary" | "success" | "warning" | "destructive";

/**
 * Small status label (E02-T03), e.g. "PR" next to a set or "Planned" on a
 * session row: 12 px semibold pill. Not interactive; for removable tags use
 * Chip. Never used as a count on navigation (docs/design-system.md).
 */
export function Badge({
  variant = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-semibold whitespace-nowrap",
        VARIANT_CLASS_NAMES[variant],
        className,
      )}
      {...props}
    />
  );
}

const VARIANT_CLASS_NAMES: Record<BadgeVariant, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};
