import { type ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

/** `icon` is a square 44 × 44 px button for a single icon (needs `aria-label`). */
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Shows a spinner and ignores clicks (and form submits) while an action
   * runs. The button stays focusable (`aria-disabled`, not `disabled`), so
   * keyboard focus isn't lost, and is marked `aria-busy`.
   */
  isLoading?: boolean;
  /** Accessible name of the spinner, announced with the label. */
  loadingLabel?: string;
  /** Render the single child (e.g. a `<Link>`) with the button styles. */
  asChild?: boolean;
}
