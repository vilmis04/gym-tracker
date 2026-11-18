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

import type { DialogContentProps } from "./dialog.types";

/**
 * Sheet (E02-T03): a modal panel on Radix Dialog, with the same focus trap,
 * `Esc` and focus return as Dialog. Below 1024 px it is a bottom sheet
 * (24 px top corners and a drag-handle look, as the mock-ups' "Add exercise"
 * picker; it is not draggable); from 1024 px a panel on the right edge.
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
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col gap-5 overflow-y-auto border-border bg-popover text-popover-foreground shadow-overlay outline-none",
          // Mobile: bottom sheet, above the iPhone home indicator.
          "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-3xl border-t px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          "data-[state=closed]:animate-sheet-out-bottom data-[state=open]:animate-sheet-in-bottom",
          // Desktop: full-height panel on the right.
          "lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-md lg:rounded-none lg:rounded-l-3xl lg:border-t-0 lg:border-l lg:p-6",
          "lg:data-[state=closed]:animate-sheet-out-right lg:data-[state=open]:animate-sheet-in-right",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className="mx-auto h-1 w-10 shrink-0 rounded-full bg-border lg:hidden"
        />
        {children}
        <DialogCloseButton
          label={closeLabel}
          className="absolute top-4 right-3 lg:top-3"
        />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
