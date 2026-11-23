/** Remembers on this device which Clerk session already got its preferences. */
export const APPLIED_PREFERENCES_SESSION_STORAGE_KEY =
  "preferences-applied-session";

/**
 * `true` the first time it's called for `sessionId` on this device. Without
 * local storage (blocked, private mode) it is always `false`: never
 * overriding this device's choice is the safe side.
 */
export function claimSessionForSavedPreferences(sessionId: string): boolean {
  try {
    if (
      localStorage.getItem(APPLIED_PREFERENCES_SESSION_STORAGE_KEY) ===
      sessionId
    ) {
      return false;
    }
    localStorage.setItem(APPLIED_PREFERENCES_SESSION_STORAGE_KEY, sessionId);
    return true;
  } catch {
    return false;
  }
}
