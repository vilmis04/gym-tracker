import { z } from "zod";

import { themePreferenceSchema } from "@/components/common/theme/theme-preferences";
import { localeSchema } from "@/lib/i18n/locales";

/**
 * Input of `savePreferences()`: the language, the theme or both, nothing
 * else (`strictObject`: an extra key such as `email` is a validation error,
 * not silently dropped).
 */
export const preferencesInputSchema = z
  .strictObject({
    locale: localeSchema.optional(),
    theme: themePreferenceSchema.optional(),
  })
  .refine(
    ({ locale, theme }) => locale !== undefined || theme !== undefined,
    "Pass a locale, a theme or both",
  );
