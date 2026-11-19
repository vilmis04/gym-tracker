import { type ReactNode } from "react";

export interface EmptyStateProps {
  /** A decorative 20 px lucide icon, e.g. `<CalendarPlus aria-hidden="true" size={20} strokeWidth={1.5} />`. */
  icon: ReactNode;
  /** The one sentence: what is missing and what to do. */
  message: string;
  /** Usually one Button (or a Button with `asChild` around a Link). */
  action?: ReactNode;
  className?: string;
}
