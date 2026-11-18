"use client";

import { Label as LabelPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Form label (E02-T03): 14 px medium muted text above the control, as in the
 * mock-ups. Radix Label keeps a double click from selecting the text.
 */
export function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-sm font-medium text-muted-foreground select-none",
        className,
      )}
      {...props}
    />
  );
}
