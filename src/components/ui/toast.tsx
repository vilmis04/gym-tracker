"use client";

import { Toaster as Sonner, toast } from "sonner";

import { cn } from "@/lib/utils/cn";

import { FOCUS_RING_CLASS_NAME } from "./focus-ring";

import type { ShowToastOptions } from "./toast.types";

/** How long a toast stays: 4 s (docs/design-system.md). Hovering pauses it. */
export const TOAST_DURATION_MS = 4000;

/**
 * Shows a short, calm confirmation (E02-T03): "Set saved", "New personal
 * record: 32.5 kg". Announced politely by screen readers; dismissed after
 * {@link TOAST_DURATION_MS}, by swiping, or from the keyboard (Alt+T focuses
 * the toasts). Returns the toast id.
 */
export function showToast(
  message: string,
  { description, action, id }: ShowToastOptions = {},
) {
  return toast(message, { description, action, id });
}

/**
 * Renders the toasts (sonner), mounted once in the root layout. Styled like
 * the mock-ups: inverted (foreground fill, background text), 14 px radius,
 * bottom center; below 1024 px 20 px above the bottom navigation (96 px plus
 * the iPhone home-indicator inset), 24 px up on desktop
 * (`--toast-offset-bottom` in globals.css).
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      duration={TOAST_DURATION_MS}
      offset={{ bottom: TOAST_OFFSET_BOTTOM }}
      mobileOffset={{ bottom: TOAST_OFFSET_BOTTOM, left: 16, right: 16 }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-overlay",
          content: "flex flex-1 flex-col gap-0.5 py-0.5",
          title: "font-medium",
          description: "text-background/80",
          actionButton: cn(
            "-my-1 -mr-2 min-h-11 shrink-0 cursor-pointer rounded-md px-3 font-semibold text-background hover:bg-background/10",
            // The usual ring color is too close to the dark fill in the light theme.
            FOCUS_RING_CLASS_NAME,
            "focus-visible:outline-background",
          ),
        },
      }}
    />
  );
}

// sonner's own "mobile" breakpoint is 600 px, but the bottom navigation shows
// up to 1024 px, so the offset follows the app's breakpoint in CSS instead.
const TOAST_OFFSET_BOTTOM = "var(--toast-offset-bottom)";
