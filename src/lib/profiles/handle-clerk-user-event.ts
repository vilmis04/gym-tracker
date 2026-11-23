import "server-only";

import { buildProfileSyncInput } from "./build-profile-sync-input";
import { getClerkProfileSourceFromJSON } from "./clerk-webhook";
import { ProfileSyncStatus } from "./profile-sync-status";
import { deleteProfileFromClerk, syncProfileFromClerk } from "./sync-profile";

import type { ClerkEventOutcomeValue, ClerkUserEvent } from "./profiles.types";

/** What the webhook did with an event; returned in the response body. */
export const ClerkEventOutcome = {
  ...ProfileSyncStatus,
  DELETED: "deleted",
  /** The user has no email address, so no profile can be stored. */
  IGNORED_NO_EMAIL: "ignored_no_email",
  /** Not a `user.*` event, or a payload without the fields the sync reads. */
  IGNORED_UNSUPPORTED: "ignored_unsupported",
} as const;

/**
 * Applies a verified `user.*` event to `profiles`: created/updated → sync
 * (newer data wins, deleted users stay deleted), deleted → delete. Safe to
 * run any number of times for the same event.
 *
 * @throws {Error} When the database call fails (the webhook answers 500 and
 *   Clerk retries the event).
 */
export async function handleClerkUserEvent(
  event: ClerkUserEvent,
): Promise<ClerkEventOutcomeValue> {
  if (event.type === "user.deleted") {
    await deleteProfileFromClerk(event.data.id);
    return ClerkEventOutcome.DELETED;
  }
  const syncInput = buildProfileSyncInput(
    getClerkProfileSourceFromJSON(event.data),
  );
  if (!syncInput) return ClerkEventOutcome.IGNORED_NO_EMAIL;
  return syncProfileFromClerk(syncInput);
}
