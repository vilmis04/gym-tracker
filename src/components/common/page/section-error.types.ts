import { type MessageKey } from "@/lib/i18n/i18n.types";

export interface SectionErrorProps {
  /** What was thrown (Next.js `error.tsx` prop); not always an `Error`. */
  error: unknown;
  /** Re-fetches and re-renders the section (Next.js `error.tsx` prop). */
  retry: () => void;
  /** The section's title in the `nav` messages, shown in the page header. */
  titleKey: MessageKey<"nav">;
}
