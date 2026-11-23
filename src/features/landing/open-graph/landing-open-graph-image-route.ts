import type { Locale } from "@/lib/i18n/i18n.types";

/** The size link previews expect (1.91:1). */
export const LANDING_OPEN_GRAPH_IMAGE_SIZE = { width: 1200, height: 630 };

/**
 * Where the landing page's Open Graph image is served, next to the page:
 * "/lt/og-image.png" (`app/[locale]/(public)/og-image.png/route.ts`).
 */
export function getLandingOpenGraphImagePath(locale: Locale): string {
  return `/${locale}/og-image.png`;
}
