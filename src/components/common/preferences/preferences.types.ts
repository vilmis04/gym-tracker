import type { ThemePreference } from "@/components/common/theme/theme.types";
import type { Locale } from "@/lib/i18n/i18n.types";

/** Whether saving a preference to the profile worked. */
export type PreferenceSaveOutcome = "saved" | "failed";

export type PreferenceSaveOutcomeListener = (
  outcome: PreferenceSaveOutcome,
) => void;

/** The profile's saved choices, as `EnsureProfile` hands them to the browser. */
export interface ApplySavedPreferencesProps {
  /**
   * The Clerk session: saved preferences are applied once per session and
   * device (right after signing in), never again while the user switches.
   */
  sessionId: string;
  savedLocale: Locale;
  savedTheme: ThemePreference;
  /** `false` while the profile holds only the defaults (never saved). */
  hasSavedPreferences: boolean;
}
