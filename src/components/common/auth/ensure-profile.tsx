import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";

import { ApplySavedPreferences } from "@/components/common/preferences/apply-saved-preferences";
import type { ApplySavedPreferencesProps } from "@/components/common/preferences/preferences.types";
import { themePreferenceSchema } from "@/components/common/theme/theme-preferences";
import { localeSchema } from "@/lib/i18n/locales";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

/**
 * Makes sure the signed-in user has a `profiles` row (E04-T03 first-request
 * fallback for a late `user.created` webhook) and hands its saved language
 * and theme to `ApplySavedPreferences` (E04-T04), which applies them once
 * after sign-in. Streamed in its own `<Suspense>` by the `(app)` layout so
 * the page doesn't wait for it.
 *
 * `connection()` keeps it out of prerendering, so the signed-in pages are
 * rendered per request with or without Clerk keys at build time (a
 * prerendered page would never run it).
 *
 * A failure is reported, not thrown: the sync is retried on the next
 * request, while an error here would replace the whole signed-in area.
 * Pages that need the profile call `getCurrentProfile()` themselves (the same
 * request-cached promise) and handle its errors in their `error.tsx`.
 */
export async function EnsureProfile() {
  await connection();
  let savedPreferences: ApplySavedPreferencesProps | null;
  try {
    savedPreferences = await loadSavedPreferences();
  } catch (error) {
    // Next.js signals (dynamic rendering, redirects) must reach Next.js.
    unstable_rethrow(error);
    Sentry.captureException(error);
    return null;
  }
  return savedPreferences && <ApplySavedPreferences {...savedPreferences} />;
}

/** `null` when signed out, without Clerk keys or without a profile. */
const loadSavedPreferences =
  async (): Promise<ApplySavedPreferencesProps | null> => {
    // Signed out and without Clerk keys this is `null` before `auth()` is
    // needed (which would throw without Clerk's middleware).
    const profile = await getCurrentProfile();
    if (!profile) return null;
    const { sessionId } = await auth();
    const savedLocale = localeSchema.safeParse(profile.locale);
    const savedTheme = themePreferenceSchema.safeParse(profile.theme);
    if (!sessionId || !savedLocale.success || !savedTheme.success) return null;
    return {
      sessionId,
      savedLocale: savedLocale.data,
      savedTheme: savedTheme.data,
      hasSavedPreferences: profile.preferences_updated_at !== null,
    };
  };
