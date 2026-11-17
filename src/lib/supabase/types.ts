import type { Database } from "@/types/database";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Supabase client typed with the generated `Database` schema. */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Returns the JWT Supabase should send as `Authorization: Bearer …`, or `null`
 * to fall back to the anon key (signed-out user).
 *
 * Supabase calls it before every request (and for Realtime), so it must be
 * cheap; Clerk's `getToken()` caches and refreshes the token itself.
 * Matches the signature of Clerk's `getToken()` (E04-T02).
 */
export type AccessTokenProvider = () => Promise<string | null>;

/** Options shared by `createServerClient()` and `createBrowserClient()`. */
export type SupabaseClientOptions = {
  /** Supplies the user's Clerk session token; defaults to a signed-out stub. */
  accessToken?: AccessTokenProvider;
};

/**
 * Placeholder until Clerk is wired in (E04-T02): always signed out, so requests
 * use the anon key and RLS only lets through what `anon` may see.
 */
export const signedOutAccessToken: AccessTokenProvider = async () => null;
