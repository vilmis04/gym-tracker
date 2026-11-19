"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Popover (E02-T03) on Radix Popover: non-modal floating panel, `Esc` and an
 * outside click close it and return focus to the trigger. The Combobox
 * (E02-T04) builds on it.
 */
export const Popover = PopoverPrimitive.Root;

export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(OVERLAY_PANEL_CLASS_NAME, "w-72 p-4", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

/** Shared look of floating panels (popovers, dropdown menus): the one shadow level. */
export const OVERLAY_PANEL_CLASS_NAME = cn(
  "z-50 max-h-(--radix-popper-available-height) origin-(--radix-popper-transform-origin) overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-overlay outline-none",
  "data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in",
);
