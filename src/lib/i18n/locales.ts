import { z } from "zod";

import type { Locale } from "./i18n.types";

/** Supported UI languages; Lithuanian is the default (docs/epics/E03-i18n.md). */
export const LOCALES = ["lt", "en"] as const;

export const DEFAULT_LOCALE = "lt";

/**
 * Remembers the language between visits (next-intl's default name). Read and
 * written by the proxy (`src/proxy.ts`) on document requests, and in the
 * browser by next-intl's router when switching (`src/lib/i18n/navigation.ts`).
 */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/** One year, so the choice survives closing the browser. */
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Validates a locale from untrusted input (URL segment, menu value). */
export const localeSchema = z.enum(LOCALES);

/** Language names as their speakers write them; never translated. */
export const LOCALE_NATIVE_NAMES = {
  lt: "Lietuvių",
  en: "English",
} as const satisfies Record<Locale, string>;
