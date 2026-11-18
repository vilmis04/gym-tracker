import { type Dialog as DialogPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

export interface DialogContentProps extends ComponentProps<
  typeof DialogPrimitive.Content
> {
  /** Accessible name of the × button in the corner. */
  closeLabel?: string;
}
