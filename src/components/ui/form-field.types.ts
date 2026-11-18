import { type ReactElement } from "react";

export interface FormFieldProps {
  label: string;
  /** Hint under the control, linked with `aria-describedby`. */
  help?: string;
  /** Error message; `null` or absent means valid. Sets `aria-invalid`. */
  error?: string | null;
  /** Visually hidden label (still announced), e.g. a search field with an icon. */
  isLabelHidden?: boolean;
  className?: string;
  /** Exactly one control (Input, Textarea, …): it receives `id`, `aria-describedby` and `aria-invalid`. */
  children: ReactElement;
}
