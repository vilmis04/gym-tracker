import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { profileSyncStatusSchema } from "./profile-sync-status";

import type {
  ProfileSyncInput,
  ProfileSyncStatusValue,
} from "./profiles.types";

/**
 * Creates or updates a profile from Clerk data with the service role
 * (`sync_profile_from_clerk()`): an outdated event or one for a deleted user
 * changes nothing. Only for verified Clerk data (webhook, `currentUser()`).
 *
 * @throws {Error} When the database call fails.
 */
export async function syncProfileFromClerk({
  id,
  displayName,
  email,
  avatarUrl,
  clerkUpdatedAt,
}: ProfileSyncInput): Promise<ProfileSyncStatusValue> {
  const { data, error } = await createAdminClient().rpc(
    "sync_profile_from_clerk",
    {
      incoming_id: id,
      incoming_display_name: displayName,
      incoming_email: email,
      incoming_clerk_updated_at: clerkUpdatedAt.toISOString(),
      // The SQL parameter defaults to null; generated types can't say "or null".
      incoming_avatar_url: avatarUrl ?? undefined,
    },
  );
  if (error) throw new Error("Could not sync the profile", { cause: error });
  return profileSyncStatusSchema.parse(data);
}

/**
 * Deletes a profile after Clerk's `user.deleted` and remembers the id, so a
 * late event can't bring it back (`delete_profile_from_clerk()`). Deleting a
 * missing profile succeeds.
 *
 * @throws {Error} When the database call fails.
 */
export async function deleteProfileFromClerk(id: string): Promise<void> {
  const { error } = await createAdminClient().rpc("delete_profile_from_clerk", {
    incoming_id: id,
  });
  if (error) throw new Error("Could not delete the profile", { cause: error });
}
