import type { Locale } from "@/lib/i18n/i18n.types";

/**
 * Called after the user switches language; signed-in pages pass
 * `saveLocaleToProfile` (E04-T04), which saves it to `profiles.locale`.
 */
export type OnLocaleChange = (locale: Locale) => void;

export interface UseLocaleSwitchOptions {
  onLocaleChange?: OnLocaleChange;
}

export interface LocaleSwitchState {
  locale: Locale;
  /** Opens the current page in `targetLocale`; does nothing for the current one. */
  switchLocale: (targetLocale: Locale) => void;
}
