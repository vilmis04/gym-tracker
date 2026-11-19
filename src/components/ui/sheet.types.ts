import { type DialogContentProps } from "./dialog.types";

export interface SheetContentProps extends DialogContentProps {
  /**
   * Below 1024 px: `default` is a bottom sheet up to 90 dvh with a drag
   * handle; `full` fills the visible viewport (it shrinks above the
   * on-screen keyboard, see `useVisualViewportVariables`), e.g. the
   * Combobox on a phone. From 1024 px both are the right-hand panel.
   */
  size?: "default" | "full";
}
