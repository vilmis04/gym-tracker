import { defineRouting } from "next-intl/routing";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  LOCALES,
} from "./locales";

/**
 * next-intl's routing: every page is under `/lt/…` or `/en/…` (prefix
 * always shown). A URL without a locale is redirected to the one chosen by
 * the proxy: `NEXT_LOCALE` cookie → `Accept-Language` → `lt`.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localeCookie: {
    name: LOCALE_COOKIE_NAME,
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
  },
});
