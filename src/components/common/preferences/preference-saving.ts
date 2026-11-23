import type { ThemePreference } from "@/components/common/theme/theme.types";
import type { Locale } from "@/lib/i18n/i18n.types";
import { savePreferences } from "@/lib/profiles/save-preferences";

import type {
  PreferenceSaveOutcome,
  PreferenceSaveOutcomeListener,
} from "./preferences.types";

/**
 * `onLocaleChange` for signed-in pages (E04-T04): saves the language the
 * user just switched to in their profile and announces the outcome
 * (`PreferenceSaveToast` shows "Saved").
 */
export function saveLocaleToProfile(locale: Locale): void {
  void savePreferencesAndAnnounce({ locale });
}

/** `onThemePreferenceChange` for signed-in pages; see `saveLocaleToProfile`. */
export function saveThemeToProfile(theme: ThemePreference): void {
  void savePreferencesAndAnnounce({ theme });
}

/**
 * Calls `listener` with every save outcome from now on, and at once with
 * one that arrived in the last few seconds while nobody listened. Switching
 * language remounts the whole `[locale]` tree, toast area included, so the
 * outcome of that save usually arrives before the new page's listener is
 * there; it is then shown by the new page, in the new language.
 * Returns the unsubscribe function.
 */
export function subscribeToPreferenceSaveOutcomes(
  listener: PreferenceSaveOutcomeListener,
): () => void {
  listeners.add(listener);
  if (
    undeliveredOutcome !== undefined &&
    Date.now() - undeliveredOutcome.announcedAt <=
      UNDELIVERED_OUTCOME_MAX_AGE_MILLISECONDS
  ) {
    listener(undeliveredOutcome.outcome);
  }
  undeliveredOutcome = undefined;
  return () => {
    listeners.delete(listener);
  };
}

const listeners = new Set<PreferenceSaveOutcomeListener>();

let undeliveredOutcome:
  { outcome: PreferenceSaveOutcome; announcedAt: number } | undefined;

// Long enough for a language switch to render the new page, short enough
// that a "Saved" never shows up on an unrelated later visit.
const UNDELIVERED_OUTCOME_MAX_AGE_MILLISECONDS = 5000;

const savePreferencesAndAnnounce = async (
  input: Parameters<typeof savePreferences>[0],
) => {
  const outcome = await savePreferences(input).then(
    (result): PreferenceSaveOutcome => (result.ok ? "saved" : "failed"),
    // Offline, or an action ID from an older deployment: the choice still
    // applies on this device, only syncing it failed.
    (): PreferenceSaveOutcome => "failed",
  );
  announce(outcome);
};

const announce = (outcome: PreferenceSaveOutcome) => {
  if (listeners.size === 0) {
    undeliveredOutcome = { outcome, announcedAt: Date.now() };
    return;
  }
  for (const listener of listeners) listener(outcome);
};
