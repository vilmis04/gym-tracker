import { type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Loading placeholder (E02-T03): a softly pulsing `bg-muted` block; size it
 * with classes (`h-5 w-32`, `size-10 rounded-full`). Hidden from screen
 * readers: mark the loading region with `aria-busy` and say "Loading" once.
 * The pulse stops with `prefers-reduced-motion`.
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
