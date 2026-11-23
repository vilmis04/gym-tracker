"use client";

import { useMemo } from "react";

import { createBrowserClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";

import { useAccount } from "./account-context";

/**
 * The tab's Supabase client acting as the signed-in user (E04-T02): requests
 * carry the Clerk session token from `useAccount()`, so RLS sees the user's
 * `uid()`. While Clerk loads, when signed out and without Clerk keys there is
 * no account, and requests go out as `anon` (no user data); start queries
 * that need the user only once `useAccount()` is set.
 */
export function useSupabaseBrowserClient(): TypedSupabaseClient {
  const getToken = useAccount()?.getToken;
  return useMemo(
    () => createBrowserClient({ accessToken: getToken }),
    [getToken],
  );
}
