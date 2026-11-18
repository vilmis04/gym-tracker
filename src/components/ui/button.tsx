"use client";

import { LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";
import { type MouseEvent } from "react";

import { cn } from "@/lib/utils/cn";

import { FOCUS_RING_CLASS_NAME } from "./focus-ring";
import { UI_LABELS } from "./ui-labels";

import type { ButtonProps, ButtonSize, ButtonVariant } from "./button.types";

/**
 * Button (E02-T03): `primary` for the one main action of a screen,
 * `secondary` (outlined) for other actions, `ghost` for low-emphasis and
 * icon buttons, `destructive` for deleting. Every size is at least 44 px
 * tall, the minimum touch target.
 */
export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingLabel = UI_LABELS.loading,
  asChild = false,
  className,
  children,
  onClick,
  type = "button",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Root : "button";

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isLoading) {
      // Also stops a submit button from submitting its form again.
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <Component
      type={asChild ? undefined : type}
      className={cn(
        BASE_CLASS_NAME,
        VARIANT_CLASS_NAMES[variant],
        SIZE_CLASS_NAMES[size],
        className,
      )}
      aria-disabled={isLoading || undefined}
      aria-busy={isLoading || undefined}
      onClick={handleClick}
      {...props}
    >
      {isLoading && (
        <>
          <LoaderCircle
            aria-hidden="true"
            size={20}
            strokeWidth={1.5}
            className="animate-spin"
          />
          <span className="sr-only">{loadingLabel}</span>{" "}
        </>
      )}
      <Slot.Slottable>{children}</Slot.Slottable>
    </Component>
  );
}

const BASE_CLASS_NAME = cn(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap transition-colors duration-150 ease-out select-none",
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  FOCUS_RING_CLASS_NAME,
);

const VARIANT_CLASS_NAMES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary font-semibold text-primary-foreground hover:bg-primary/90",
  // The border is the only boundary of the control, so it uses `--input` (3:1).
  secondary:
    "border border-input bg-transparent font-medium text-foreground hover:bg-secondary",
  ghost: "bg-transparent font-medium text-foreground hover:bg-accent",
  destructive:
    "bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90",
};

const SIZE_CLASS_NAMES: Record<ButtonSize, string> = {
  sm: "h-11 rounded-md px-4 text-sm",
  md: "h-12 rounded-lg px-5 text-base",
  lg: "h-14 rounded-lg px-6 text-base",
  icon: "size-11 rounded-full",
};
