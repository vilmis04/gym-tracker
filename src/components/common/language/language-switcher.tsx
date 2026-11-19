"use client";

import { useTranslations } from "next-intl";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { LOCALE_NATIVE_NAMES, LOCALES } from "@/lib/i18n/locales";

import { useLocaleSwitch } from "./use-locale-switch";

import type { UseLocaleSwitchOptions } from "./language.types";

/**
 * Lietuvių / English switch (E03-T02) for pages without the avatar menu,
 * such as the landing page. A SegmentedControl (native radio group), so Tab
 * moves into it, the arrow keys switch the language and the current one is
 * the checked option. Each name is in its own language (`lang`), so screen
 * readers pronounce it correctly. The avatar menu offers the same choices as
 * menu radio items (`AccountMenu`), through the same `useLocaleSwitch()`.
 */
export function LanguageSwitcher({ onLocaleChange }: UseLocaleSwitchOptions) {
  const translate = useTranslations("common");
  const { locale, switchLocale } = useLocaleSwitch({ onLocaleChange });

  return (
    <SegmentedControl
      legend={translate("language")}
      options={LANGUAGE_OPTIONS}
      value={locale}
      onValueChange={switchLocale}
    />
  );
}

// Native names are never translated, so the options are the same everywhere.
const LANGUAGE_OPTIONS = LOCALES.map((locale) => ({
  value: locale,
  label: LOCALE_NATIVE_NAMES[locale],
  lang: locale,
}));
