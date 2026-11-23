"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

import { useLocaleSwitch } from "@/components/common/language/use-locale-switch";
import { themePreferenceSchema } from "@/components/common/theme/theme-preferences";
import { savePreferences } from "@/lib/profiles/save-preferences";

import { claimSessionForSavedPreferences } from "./applied-preferences-session";

import type { ApplySavedPreferencesProps } from "./preferences.types";

/**
 * Brings the profile's language and theme to this device once per Clerk
 * session (E04-T04), i.e. right after signing in: a user who switched to
 * English on their phone gets English on the desktop as soon as they sign
 * in there. The language switch opens the same page in the saved locale and
 * writes `NEXT_LOCALE`, so from then on the proxy picks it without a
 * database lookup; the theme goes to next-themes' local storage.
 *
 * Afterwards this device's own switches win (and are saved to the profile
 * by the avatar menu and the settings page), so nothing is overridden while
 * the user is signed in. A profile that was never saved (a new user) holds
 * only the defaults: then this device's current choice is saved instead of
 * replacing the language the user just picked on the landing page.
 *
 * Renders nothing. Rendered by `EnsureProfile` in the `(app)` layout.
 */
export function ApplySavedPreferences({
  sessionId,
  savedLocale,
  savedTheme,
  hasSavedPreferences,
}: ApplySavedPreferencesProps) {
  const { locale, switchLocale } = useLocaleSwitch();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!claimSessionForSavedPreferences(sessionId)) return;
    if (!hasSavedPreferences) {
      void savePreferences({
        locale,
        // An unknown stored value (local storage is user-editable) isn't saved.
        theme: themePreferenceSchema.safeParse(theme).data,
      });
      return;
    }
    if (savedTheme !== theme) setTheme(savedTheme);
    switchLocale(savedLocale);
  }, [
    sessionId,
    savedLocale,
    savedTheme,
    hasSavedPreferences,
    locale,
    switchLocale,
    theme,
    setTheme,
  ]);

  return null;
}
