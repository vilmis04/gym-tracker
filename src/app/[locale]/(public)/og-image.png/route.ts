import { hasLocale } from "next-intl";

import { renderLandingOpenGraphImage } from "@/features/landing/open-graph/landing-open-graph-image";
import { LOCALES } from "@/lib/i18n/locales";

/**
 * `/lt/og-image.png`, `/en/og-image.png`: the landing page's Open Graph
 * image (E04-T05), prerendered at build time for both locales. A route
 * handler instead of the `opengraph-image` file convention, because only
 * the page's metadata can give it a translated `alt` (`generateImageMetadata`
 * can't learn the locale of a route handler at build time). The proxy skips
 * paths with a dot, so it is public.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/og-image.png">,
) {
  const { locale } = await params;
  if (!hasLocale(LOCALES, locale)) {
    return new Response(null, { status: 404 });
  }
  return renderLandingOpenGraphImage(locale);
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Other first segments are no locale: 404 instead of rendering on request.
export const dynamicParams = false;
