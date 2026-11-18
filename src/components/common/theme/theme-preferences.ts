import { z } from "zod";

/** The values next-themes stores in local storage and `profiles.theme` holds. */
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;

export const DEFAULT_THEME_PREFERENCE = "system";

export const THEME_STORAGE_KEY = "theme";

export const themePreferenceSchema = z.enum(THEME_PREFERENCES);

// TODO(E03): translate via next-intl.
export const THEME_TOGGLE_LEGEND = "Theme";

// TODO(E03): translate via next-intl.
export const THEME_PREFERENCE_LABELS = {
  light: "Light",
  dark: "Dark",
  system: "System",
} as const;
