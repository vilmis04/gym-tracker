"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import { Button } from "./button";
import { UI_LABELS } from "./ui-labels";

import type { DialogContentProps } from "./dialog.types";

/**
 * Modal dialog (E02-T03) on Radix Dialog: focus moves into it and is trapped
 * there, `Esc` and the scrim close it, and focus returns to the trigger.
 * Always give it a DialogTitle (and a DialogDescription, or pass
 * `aria-describedby={undefined}` to DialogContent).
 */
export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
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
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-overlay outline-none",
          "data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in",
          className,
        )}
        {...props}
      >
        {children}
        <DialogCloseButton
          label={closeLabel}
          className="absolute top-3 right-3"
        />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Title and description; leaves room for the × button. */
export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-2 pr-10", className)} {...props} />
  );
}

/** Actions: stacked full width on mobile (primary on top), in a row on wider screens. */
export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-xl font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-base text-muted-foreground", className)}
      {...props}
    />
  );
}

/** The scrim behind dialogs and sheets (`--scrim`). */
export function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in",
        className,
      )}
      {...props}
    />
  );
}

/** The 44 × 44 px × button in the corner of dialogs and sheets. */
export function DialogCloseButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <DialogPrimitive.Close asChild>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        className={className}
      >
        <X aria-hidden="true" size={20} strokeWidth={1.5} />
      </Button>
    </DialogPrimitive.Close>
  );
}
