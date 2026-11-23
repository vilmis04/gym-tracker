import { locale as getLocaleRootParam } from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, LOCALES } from "./locales";
import { MESSAGES } from "./messages";

/**
 * next-intl's per-request config (wired in `next.config.ts`). The locale is
 * the `[locale]` root param, read with `next/root-params` (next-intl
 * deprecated `setRequestLocale` in its favor), so pages stay statically
 * rendered. Routes outside `app/[locale]` (`/dev`, `/debug`) have no root
 * param and get the default locale. `getTranslations({ locale, namespace })`
 * overrides it, e.g. in Server Actions, where root params can't be read.
 */
export default getRequestConfig(async ({ locale: requestedLocale }) => {
  const candidateLocale = requestedLocale ?? (await getLocaleRootParam());
  const locale = hasLocale(LOCALES, candidateLocale)
    ? candidateLocale
    : DEFAULT_LOCALE;

  return { locale, messages: MESSAGES[locale] };
});
