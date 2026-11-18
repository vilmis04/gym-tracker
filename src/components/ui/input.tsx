import { type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import { FOCUS_RING_CLASS_NAME } from "./focus-ring";

/**
 * Text input (E02-T03), filled like the mock-ups: 56 px tall, `bg-surface`,
 * no border (identified by its label and fill, docs/design-system.md),
 * 16 px text so iOS doesn't zoom on focus. `aria-invalid` adds a destructive
 * ring (set by FormField when it has an error).
 */
export function Input({
  className,
  type = "text",
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(FIELD_CLASS_NAME, "h-14 px-4", className)}
      {...props}
    />
  );
}

/** Shared by Input and Textarea. */
export const FIELD_CLASS_NAME = cn(
  "w-full min-w-0 rounded-lg bg-surface text-base text-foreground transition-shadow duration-150 ease-out placeholder:text-muted-foreground",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:ring-2 aria-invalid:ring-destructive",
  FOCUS_RING_CLASS_NAME,
);
