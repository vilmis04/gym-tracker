"use client";

import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import { OVERLAY_PANEL_CLASS_NAME } from "./popover";

/**
 * Dropdown menu (E02-T03) on Radix DropdownMenu: Enter / Space / ↓ open it,
 * the arrow keys and typeahead move between items, `Esc` closes it and
 * returns focus to the trigger. Items are 44 px tall (touch targets). Used
 * for "⋯" menus and the avatar menu (E02-T06).
 */
export const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 8,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(OVERLAY_PANEL_CLASS_NAME, "min-w-48 p-1.5", className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  /** `destructive` for delete / leave actions. */
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-base outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent [&_svg]:shrink-0",
        // Highlight follows keyboard focus; the ring makes it visible on any fill.
        "focus-visible:ring-2 focus-visible:ring-ring",
        variant === "destructive"
          ? "text-destructive [&_svg]:text-destructive"
          : "text-popover-foreground [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn(
        "px-3 py-2 text-sm font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1.5 my-1.5 h-px bg-border", className)}
      {...props}
    />
  );
}
