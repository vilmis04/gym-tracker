import { useLocale, useNow, useTimeZone, useTranslations } from "next-intl";
import { useMemo } from "react";

import { DEFAULT_TIME_ZONE } from "../time-zone";
import { createFormatPresets } from "./create-format-presets";
import { useBrowserTimeZone } from "./use-browser-time-zone";

import type { FormatPresets } from "./format.types";

/**
 * Formatting presets for client components (E03-T03): `weight`, `date`,
 * `dateTime`, `relative`, `duration` in the active locale.
 *
 * ```tsx
 * const format = useFormat();
 * <p>{format.weight(57.5)} · {format.relative(session.endedAt)}</p>
 * ```
 *
 * Times are in the browser's time zone. The server render and hydration use
 * the provider's zone (`Europe/Vilnius`, or the time zone cookie where a
 * dynamic layout passes `getRequestTimeZone()` to a `NextIntlClientProvider`),
 * then the browser's right after hydration, so there is never a hydration
 * mismatch. `relative()` counts from the provider's `now` if it has one,
 * else from when the component mounted (next-intl's `useNow()`). Without a
 * provider `now`, the server render and hydration count from different
 * moments, which a prerendered page makes the build time: so pass `now` (and
 * the cookie's zone) to the provider of a dynamic layout that renders
 * relative times, and don't server-render them on static pages.
 */
export function useFormat(): FormatPresets {
  const locale = useLocale();
  const providerTimeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;
  const browserTimeZone = useBrowserTimeZone();
  const now = useNow();
  const translate = useTranslations("format");
  const timeZone = browserTimeZone ?? providerTimeZone;

  return useMemo(
    () => createFormatPresets({ locale, timeZone, now, translate }),
    [locale, timeZone, now, translate],
  );
}
