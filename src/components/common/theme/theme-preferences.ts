import { Monitor, Moon, Sun } from "lucide-react";
import { z } from "zod";

import type { MessageKey } from "@/lib/i18n/i18n.types";

import type { ThemePreference } from "./theme.types";

/** The values next-themes stores in local storage and `profiles.theme` holds. */
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;

export const DEFAULT_THEME_PREFERENCE = "system";

export const THEME_STORAGE_KEY = "theme";

export const themePreferenceSchema = z.enum(THEME_PREFERENCES);

/** Each choice's label in the `common` messages and its lucide icon. */
export const THEME_PREFERENCE_OPTIONS = {
  light: { labelKey: "themeLight", Icon: Sun },
  dark: { labelKey: "themeDark", Icon: Moon },
  system: { labelKey: "themeSystem", Icon: Monitor },
} as const satisfies Record<
  ThemePreference,
  { labelKey: MessageKey<"common">; Icon: typeof Sun }
>;
