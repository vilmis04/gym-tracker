import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getPublicSupabaseEnv } from "./env";
import {
  signedOutAccessToken,
  type SupabaseClientOptions,
  type TypedSupabaseClient,
} from "./types";

let browserClient: TypedSupabaseClient | undefined;

/**
 * Returns the Supabase client for **client components** (`"use client"`), e.g.
 * TanStack Query live views and Realtime subscriptions on the logging screen.
 *
 * In the browser it is a singleton per tab: the first call creates it and
 * later calls return the same instance (one Realtime connection, one set of
 * channels), so `options` only take effect on the first call. Pass a token
 * provider that always reads the *current* session, e.g. Clerk's
 * `async () => (await window.Clerk?.session?.getToken()) ?? null` (wired in
 * E04-T02); until then the default is a signed-out stub (anon key + RLS).
 *
 * During server-side rendering of a client component there is no tab, so each
 * call returns a fresh client instead of sharing one between requests.
 *
 * Only ever uses the public anon key; RLS decides what the user can see. Not
 * for server code (use `createServerClient()` from `@/lib/supabase/server`).
 *
 * @throws {Error} When `NEXT_PUBLIC_SUPABASE_URL` or
 *   `NEXT_PUBLIC_SUPABASE_ANON_KEY` was not set at build time.
 */
export function createBrowserClient({
  accessToken = signedOutAccessToken,
}: SupabaseClientOptions = {}): TypedSupabaseClient {
  if (typeof window === "undefined") {
    return create(accessToken);
  }
  browserClient ??= create(accessToken);
  return browserClient;
}

function create(
  accessToken: NonNullable<SupabaseClientOptions["accessToken"]>,
): TypedSupabaseClient {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createClient<Database>(url, anonKey, { accessToken });
}
