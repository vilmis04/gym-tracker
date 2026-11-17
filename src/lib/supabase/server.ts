import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getPublicSupabaseEnv } from "./env";
import {
  signedOutAccessToken,
  type SupabaseClientOptions,
  type TypedSupabaseClient,
} from "./types";

/**
 * Creates a Supabase client for **Server Components, Server Actions and Route
 * Handlers** that acts as the signed-in user, so every query goes through RLS.
 *
 * Call it once per request (inside the component/action/handler, never at
 * module scope): the client carries the current user's token, so sharing it
 * between requests would leak one user's access to another. Creating it is
 * cheap — it only builds HTTP clients.
 *
 * Uses the anon key plus the user's Clerk session token (Clerk is a Supabase
 * third-party auth provider, see docs/architecture.md). Until E04-T02 wires
 * Clerk in, the default `accessToken` is a signed-out stub; E04-T02 replaces
 * it with `async () => (await auth()).getToken()`.
 *
 * Not for: client components (use `createBrowserClient()` from
 * `@/lib/supabase/client`) or bypassing RLS (use `createAdminClient()` from
 * `@/lib/supabase/admin`, webhooks/admin jobs only).
 *
 * @example
 * const supabase = createServerClient();
 * const { data, error } = await supabase.from("sample_notes").select("id, body");
 *
 * @throws {Error} When `NEXT_PUBLIC_SUPABASE_URL` or
 *   `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing.
 */
export function createServerClient({
  accessToken = signedOutAccessToken,
}: SupabaseClientOptions = {}): TypedSupabaseClient {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createClient<Database>(url, anonKey, { accessToken });
}
