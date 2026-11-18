"use client";

import { useTheme } from "next-themes";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import { themePreferenceSchema } from "./theme-preferences";

import type {
  ThemePreference,
  ThemePreferenceState,
  UseThemePreferenceOptions,
} from "./theme.types";

/**
 * The user's theme choice (`light`, `dark` or `system`) and a setter that
 * applies it at once, stores it in local storage and then calls
 * `onThemePreferenceChange` (the hook for saving it to `profiles.theme`).
 */
export function useThemePreference({
  onThemePreferenceChange,
}: UseThemePreferenceOptions = {}): ThemePreferenceState {
  const { theme, setTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    getIsHydratedOnClient,
    getIsHydratedOnServer,
  );

  // Local storage is user-editable, so an unknown value means "no choice shown".
  const themePreference = useMemo(
    () =>
      isHydrated ? themePreferenceSchema.safeParse(theme).data : undefined,
    [isHydrated, theme],
  );

  const setThemePreference = useCallback(
    (preference: ThemePreference) => {
      setTheme(preference);
      onThemePreferenceChange?.(preference);
    },
    [setTheme, onThemePreferenceChange],
  );

  return { themePreference, setThemePreference };
}

// The stored theme is only known in the browser, so the server render and the
// hydration pass show no choice, and the first client render after them does.
const subscribeToNothing = () => () => {};
const getIsHydratedOnClient = () => true;
const getIsHydratedOnServer = () => false;
