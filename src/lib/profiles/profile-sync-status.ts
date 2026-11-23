import { z } from "zod";

/** What `sync_profile_from_clerk()` did (the SQL function's return values). */
export const ProfileSyncStatus = {
  /** The profile was created or updated. */
  SYNCED: "synced",
  /** The stored data is as new or newer (a replay or an out-of-order event). */
  IGNORED_OUTDATED: "ignored_outdated",
  /** The user was deleted; later events for them are dropped. */
  IGNORED_DELETED: "ignored_deleted",
} as const;

export const profileSyncStatusSchema = z.enum(ProfileSyncStatus);
