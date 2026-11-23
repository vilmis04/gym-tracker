"use client";

import { useLocale } from "next-intl";
import { useCallback } from "react";

import type { Locale } from "@/lib/i18n/i18n.types";
import { usePathname, useRouter } from "@/lib/i18n/navigation";

import type {
  LocaleSwitchState,
  UseLocaleSwitchOptions,
} from "./language.types";

/**
 * The active locale and a switch that opens the same page, query included,
 * in another locale ("/lt/sessions?tab=x" → "/en/sessions?tab=x"), saves
 * the choice in the `NEXT_LOCALE` cookie (next-intl's router) and then calls
 * `onLocaleChange` (the hook for saving it to `profiles.locale`).
 */
export function useLocaleSwitch({
  onLocaleChange,
}: UseLocaleSwitchOptions = {}): LocaleSwitchState {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = useCallback(
    (targetLocale: Locale) => {
      if (targetLocale === locale) return;
      // The query is read when switching rather than with useSearchParams(),
      // which would make every prerendered page render the switcher in the
      // browser only (up to the nearest Suspense boundary).
      router.replace(`${pathname}${window.location.search}`, {
        locale: targetLocale,
      });
      onLocaleChange?.(targetLocale);
    },
    [locale, pathname, router, onLocaleChange],
  );

  return { locale, switchLocale };
}
