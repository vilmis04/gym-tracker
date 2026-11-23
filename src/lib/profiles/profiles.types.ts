import type { Tables } from "@/types/database";

import type { clerkUserEventSchema } from "./clerk-webhook";
import type { ClerkEventOutcome } from "./handle-clerk-user-event";
import type { ProfileSyncStatus } from "./profile-sync-status";
import type { z } from "zod";

/** A row of `public.profiles` (E04-T03, docs/data-model.md). */
export type Profile = Tables<"profiles">;

/**
 * The Clerk user fields a profile is built from, whether they come from the
 * webhook payload (snake_case JSON) or from `currentUser()` (camelCase).
 */
export type ClerkProfileSource = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  /** The primary email address; `null` when the user has none. */
  email: string | null;
  hasImage: boolean;
  imageUrl: string;
  /** Clerk's `updated_at` in epoch milliseconds. */
  updatedAt: number;
};

/** The arguments of `sync_profile_from_clerk()`. */
export type ProfileSyncInput = {
  id: string;
  displayName: string;
  email: string;
  /** The user's photo; `null` when they have none (initials are shown). */
  avatarUrl: string | null;
  clerkUpdatedAt: Date;
};

export type ProfileSyncStatusValue =
  (typeof ProfileSyncStatus)[keyof typeof ProfileSyncStatus];

/** A verified Clerk webhook event the profile sync handles. */
export type ClerkUserEvent = z.infer<typeof clerkUserEventSchema>;

/** The user payload of `user.created` / `user.updated`. */
export type ClerkUserJSON = Extract<
  ClerkUserEvent,
  { type: "user.created" | "user.updated" }
>["data"];

export type ClerkEventOutcomeValue =
  (typeof ClerkEventOutcome)[keyof typeof ClerkEventOutcome];
