import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getPublicSupabaseEnv } from "./env";
import {
  signedOutAccessToken,
  type AccessTokenProvider,
  type SupabaseClientOptions,
  type TypedSupabaseClient,
} from "./types";

let browserClient: TypedSupabaseClient | undefined;
let browserAccessToken: AccessTokenProvider = signedOutAccessToken;

/**
 * Returns the Supabase client for **client components** (`"use client"`), e.g.
 * TanStack Query live views and Realtime subscriptions on the logging screen.
 * In components, use `useSupabaseBrowserClient()`
 * (`@/components/common/auth/use-supabase-browser-client`), which passes the
 * signed-in user's Clerk session token (E04-T02).
 *
 * In the browser it is a singleton per tab (one Realtime connection, one set
 * of channels). Each call sets the token provider the shared client uses from
 * then on, so the latest caller's session wins: signing in or out switches
 * every query and channel of the tab. Without `accessToken` it is signed out
 * (anon key + RLS).
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
    return createSupabaseClient(accessToken);
  }
  browserAccessToken = accessToken;
  // Reads the provider on every request, so the one client follows the
  // latest session instead of the one it was created with.
  browserClient ??= createSupabaseClient(() => browserAccessToken());
  return browserClient;
}

const createSupabaseClient = (
  accessToken: AccessTokenProvider,
): TypedSupabaseClient => {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createClient<Database>(url, anonKey, { accessToken });
};
