import { locale as getLocaleRootParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { FORMATS } from "./format/formats";
import { DEFAULT_LOCALE, LOCALES } from "./locales";
import { MESSAGES } from "./messages";
import { DEFAULT_TIME_ZONE } from "./time-zone";

/**
 * next-intl's per-request config (wired in `next.config.ts`). The locale is
 * the `[locale]` root param, read with `next/root-params` (next-intl
 * deprecated `setRequestLocale` in its favor), so pages stay statically
 * rendered. Routes outside `app/[locale]` (`/dev`, `/debug`) have no root
 * param and get the default locale. `getTranslations({ locale, namespace })`
 * overrides it, e.g. in Server Actions, where root params can't be read.
 *
 * The time zone is always `Europe/Vilnius` here (E03-T03): reading the time
 * zone cookie in this config would make every page dynamic. Client
 * components switch to the browser's zone after hydration (`useFormat()`),
 * and dynamic pages read the cookie themselves (`getFormat()`,
 * `getRequestTimeZone()`). Without a zone, next-intl would use the server's
 * (UTC in Docker). No `now` either: a prerendered page would keep the build
 * time. `formats` are the shared named formats (`FORMATS`).
 */
export default getRequestConfig(async ({ locale: requestedLocale }) => {
  const candidateLocale = requestedLocale ?? (await getLocaleRootParam());
  const locale = hasLocale(LOCALES, candidateLocale)
    ? candidateLocale
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: MESSAGES[locale],
    timeZone: DEFAULT_TIME_ZONE,
    formats: FORMATS,
  };
});
