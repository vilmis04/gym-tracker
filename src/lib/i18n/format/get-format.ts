import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";

import {
  DEFAULT_TIME_ZONE,
  TIME_ZONE_COOKIE_NAME,
  timeZoneSchema,
} from "../time-zone";
import { createFormatPresets } from "./create-format-presets";

import type { FormatPresets } from "./format.types";
import type { Locale } from "../i18n.types";

/**
 * Formatting presets for Server Components and Server Actions (E03-T03),
 * the same as `useFormat()`: times in the user's time zone from the time
 * zone cookie (written by the browser), `relative()` counting from now.
 *
 * Reading the cookie makes the route dynamic, so use it only on pages that
 * are rendered per request anyway (the signed-in area); statically
 * prerendered pages format user-specific times in client components with
 * `useFormat()` instead. The locale is the request's unless given.
 */
export async function getFormat({
  locale,
}: { locale?: Locale } = {}): Promise<FormatPresets> {
  const [resolvedLocale, timeZone] = await Promise.all([
    locale ?? getLocale(),
    getRequestTimeZone(),
  ]);
  const translate = await getTranslations({
    locale: resolvedLocale,
    namespace: "format",
  });

  return createFormatPresets({
    locale: resolvedLocale,
    timeZone,
    now: new Date(),
    translate,
  });
}

/**
 * The user's time zone from the time zone cookie, or `Europe/Vilnius` when
 * it's missing or not a valid zone. Pass it to a `NextIntlClientProvider` in
 * a dynamic layout so client components render the user's times on the
 * server too (no change after hydration). Makes the route dynamic.
 */
export async function getRequestTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  const parsedTimeZone = timeZoneSchema.safeParse(
    cookieStore.get(TIME_ZONE_COOKIE_NAME)?.value,
  );
  return parsedTimeZone.success ? parsedTimeZone.data : DEFAULT_TIME_ZONE;
}
