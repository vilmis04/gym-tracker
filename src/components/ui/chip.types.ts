import { type ReactNode } from "react";

export interface ChipProps {
  label: string;
  /** Leading visual: a 16-20 px icon or a small decorative Avatar. */
  icon?: ReactNode;
  /**
   * Makes the chip removable: adds a × button (also Delete / Backspace while
   * it has focus). Without it the chip is static text.
   */
  onRemove?: () => void;
  /** Accessible name of the × button; defaults to "Remove <label>" (`ui.remove`). */
  removeLabel?: string;
  className?: string;
}
