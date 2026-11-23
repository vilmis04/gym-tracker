import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

import { isClerkConfigured } from "@/lib/auth/clerk-env";
import type { Database } from "@/types/database";

import { getPublicSupabaseEnv } from "./env";

import type {
  AccessTokenProvider,
  SupabaseClientOptions,
  TypedSupabaseClient,
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
 * Uses the anon key plus the user's Clerk session token, `(await auth())
 * .getToken()` (E04-T02): Clerk is a Supabase third-party auth provider, so
 * Supabase verifies the token against Clerk's keys and RLS reads the Clerk
 * user id with `uid()` (docs/architecture.md). Signed out, or without Clerk
 * keys, requests carry no user token and RLS treats them as `anon`. Pass
 * `accessToken` only to act with another token (the DB tests' signed JWTs).
 *
 * Not for: client components (use `createBrowserClient()` from
 * `@/lib/supabase/client`) or bypassing RLS (use `createAdminClient()` from
 * `@/lib/supabase/admin`, webhooks/admin jobs only).
 *
 * @example
 * const supabase = createServerClient();
 * const { data, error } = await supabase.from("profiles").select("id, locale");
 *
 * @throws {Error} When `NEXT_PUBLIC_SUPABASE_URL` or
 *   `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing.
 */
export function createServerClient({
  accessToken = getClerkSessionToken,
}: SupabaseClientOptions = {}): TypedSupabaseClient {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createClient<Database>(url, anonKey, { accessToken });
}

// Without Clerk keys the proxy doesn't run `clerkMiddleware`, so `auth()`
// would throw; such builds (CI, Docker without keys) stay signed out instead,
// which RLS answers with no user data (fail closed).
const getClerkSessionToken: AccessTokenProvider = async () => {
  if (!isClerkConfigured()) return null;
  const { getToken } = await auth();
  return getToken();
};
