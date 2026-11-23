"use client";

import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/common/language/language-switcher";
import {
  saveLocaleToProfile,
  saveThemeToProfile,
} from "@/components/common/preferences/preference-saving";
import { ThemeToggle } from "@/components/common/theme/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * The settings page's Preferences section (E04-T04): language and theme.
 * Both apply at once on this device, like everywhere else, and are then
 * saved to the profile (`PreferenceSaveToast` says "Saved"). The page is
 * signed-in only, so saving is always on here.
 */
export function PreferencesCard() {
  const translate = useTranslations("settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{translate("preferencesTitle")}</CardTitle>
        <CardDescription>{translate("preferencesDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="gap-5">
        <LanguageSwitcher onLocaleChange={saveLocaleToProfile} />
        <ThemeToggle onThemePreferenceChange={saveThemeToProfile} />
      </CardContent>
    </Card>
  );
}
