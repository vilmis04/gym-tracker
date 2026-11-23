import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

import { isClerkConfigured } from "@/lib/auth/clerk-env";
import { createServerClient } from "@/lib/supabase/server";

import { buildProfileSyncInput } from "./build-profile-sync-input";
import { syncProfileFromClerk } from "./sync-profile";

import type { Profile } from "./profiles.types";

/**
 * The signed-in user's profile, read through RLS; `null` when signed out or
 * without Clerk keys (no Clerk call then).
 *
 * If the row doesn't exist yet (the `user.created` webhook is late or
 * missing), it is created from `currentUser()` first, so a new user has a
 * profile from their first signed-in request on. That write goes through the
 * same `sync_profile_from_clerk()` as the webhook, so it never overwrites
 * newer webhook data and never revives a deleted user.
 *
 * Deduplicated per request with React `cache()`: the `(app)` layout calls it
 * on every signed-in page, and pages calling it again cost nothing. Reads
 * Clerk's `auth()`, so the route is dynamic; not for `"use cache"` scopes.
 *
 * @throws {Error} When Supabase or Clerk calls fail.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!isClerkConfigured()) return null;
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerClient();
  const readOwnProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error("Could not read the profile", { cause: error });
    return data;
  };

  const existingProfile = await readOwnProfile();
  if (existingProfile) return existingProfile;

  const user = await currentUser();
  const syncInput =
    user &&
    buildProfileSyncInput({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      hasImage: user.hasImage,
      imageUrl: user.imageUrl,
      updatedAt: user.updatedAt,
    });
  if (!syncInput) return null;
  await syncProfileFromClerk(syncInput);
  return readOwnProfile();
});
