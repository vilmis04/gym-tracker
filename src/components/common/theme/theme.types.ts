import { type z } from "zod";

import { type themePreferenceSchema } from "./theme-preferences";

export type ThemePreference = z.infer<typeof themePreferenceSchema>;

/**
 * Called after the user picks a theme, e.g. to save it to `profiles.theme`
 * once signed in (E04-T04).
 */
export type OnThemePreferenceChange = (preference: ThemePreference) => void;

export interface UseThemePreferenceOptions {
  onThemePreferenceChange?: OnThemePreferenceChange;
}

export interface ThemePreferenceState {
  /** `undefined` until hydrated: the server can't read local storage. */
  themePreference: ThemePreference | undefined;
  setThemePreference: (preference: ThemePreference) => void;
}
