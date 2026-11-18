"use client";

import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils/cn";

import {
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "./dialog";
import { UI_LABELS } from "./ui-labels";
import { useVisualViewportVariables } from "./use-visual-viewport-variables";

import type { SheetContentProps } from "./sheet.types";

/**
 * Sheet (E02-T03): a modal panel on Radix Dialog, with the same focus trap,
 * `Esc` and focus return as Dialog. Below 1024 px it is a bottom sheet
 * (24 px top corners and a drag-handle look, as the mock-ups' "Add exercise"
 * picker; it is not draggable); from 1024 px a panel on the right edge.
 * `size="full"` makes the mobile sheet fill the visible viewport instead.
 */
export const Sheet = DialogPrimitive.Root;

export const SheetTrigger = DialogPrimitive.Trigger;

export const SheetClose = DialogPrimitive.Close;

export const SheetHeader = DialogHeader;

export const SheetTitle = DialogTitle;

export const SheetDescription = DialogDescription;

export const SheetFooter = DialogFooter;

export function SheetContent({
  className,
  children,
  closeLabel = UI_LABELS.close,
  size = "default",
  ...props
}: SheetContentProps) {
  const isFullSize = size === "full";
  useVisualViewportVariables(isFullSize);

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col gap-5 overflow-y-auto border-border bg-popover text-popover-foreground shadow-overlay outline-none",
          // Mobile: bottom (or full-height) sheet, above the iPhone home indicator.
          "inset-x-0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          MOBILE_SIZE_CLASS_NAMES[size],
          "data-[state=closed]:animate-sheet-out-bottom data-[state=open]:animate-sheet-in-bottom",
          // Desktop: full-height panel on the right.
          "lg:inset-y-0 lg:right-0 lg:left-auto lg:h-auto lg:max-h-none lg:w-md lg:rounded-none lg:rounded-l-3xl lg:border-t-0 lg:border-l lg:p-6",
          "lg:data-[state=closed]:animate-sheet-out-right lg:data-[state=open]:animate-sheet-in-right",
          className,
        )}
        {...props}
      >
        {!isFullSize && (
          <div
            aria-hidden="true"
            className="mx-auto h-1 w-10 shrink-0 rounded-full bg-border lg:hidden"
          />
        )}
        {children}
        <DialogCloseButton
          label={closeLabel}
          className={cn(
            "absolute right-3 lg:top-3",
            isFullSize ? "top-[max(0.5rem,env(safe-area-inset-top))]" : "top-4",
          )}
        />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

const MOBILE_SIZE_CLASS_NAMES = {
  default: "bottom-0 max-h-[90dvh] rounded-t-3xl border-t pt-3",
  // The visual viewport, falling back to the dynamic viewport before the
  // first measurement; the top padding (and the × in the same row) clears the
  // iPhone notch / status bar.
  full: "top-(--visual-viewport-top,0px) h-(--visual-viewport-height,100dvh) pt-[max(0.5rem,env(safe-area-inset-top))]",
} as const;
