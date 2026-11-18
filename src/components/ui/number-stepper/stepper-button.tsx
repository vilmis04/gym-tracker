"use client";

import { type MouseEvent, type PointerEvent } from "react";

import { cn } from "@/lib/utils/cn";

import { FOCUS_RING_CLASS_NAME } from "../focus-ring";

import type { StepperButtonProps } from "./number-stepper.types";

/**
 * The − or + of a NumberStepper: a pointer press steps at once and holds
 * repeat until release (`onPressStart` / `onPressEnd`); Enter / Space step
 * once (`onStep`). At a bound it stays focusable but is `aria-disabled`.
 */
export function StepperButton({
  label,
  isAtBound,
  disabled,
  className,
  children,
  onPressStart,
  onPressEnd,
  onStep,
}: StepperButtonProps) {
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || isAtBound) return;
    onPressStart();
  };

  // Pointer presses are handled on pointerdown; clicks with detail 0 come
  // from the keyboard (Enter / Space) or assistive technology.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0 || isAtBound) return;
    onStep();
  };

  // A long press on a phone would otherwise open the context menu.
  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={isAtBound || undefined}
      disabled={disabled}
      className={cn(BUTTON_CLASS_NAME, className)}
      onPointerDown={handlePointerDown}
      onPointerUp={onPressEnd}
      onPointerLeave={onPressEnd}
      onPointerCancel={onPressEnd}
      onBlur={onPressEnd}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {children}
    </button>
  );
}

// Sits over the input's 48 px side padding. `touch-manipulation` drops the
// double-tap zoom delay; no text selection or iOS callout on a long press.
// The focus outline goes inside, as the button is on the field's edge.
const BUTTON_CLASS_NAME = cn(
  "absolute top-0 flex h-14 w-12 cursor-pointer touch-manipulation items-center justify-center rounded-lg text-foreground transition-colors duration-150 ease-out select-none [-webkit-touch-callout:none] hover:bg-accent",
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:text-muted-foreground aria-disabled:hover:bg-transparent",
  FOCUS_RING_CLASS_NAME,
  "focus-visible:-outline-offset-2",
);
