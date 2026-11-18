import { notFound } from "next/navigation";

import { localeSchema } from "./locales";

import type { Locale } from "./i18n.types";

/**
 * The validated `[locale]` segment of a page or layout; any other value
 * (e.g. `/xx/sessions`) answers 404.
 */
export async function getLocaleParam(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  const parsedLocale = localeSchema.safeParse(locale);
  if (!parsedLocale.success) notFound();
  return parsedLocale.data;
}
