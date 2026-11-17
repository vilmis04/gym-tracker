import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getSupabaseUrl, required } from "./env";

import type { TypedSupabaseClient } from "./types";

/**
 * Creates a Supabase client with the **service-role key, which bypasses RLS**.
 *
 * Use it only where no user session exists and the code has verified the
 * caller itself: the Clerk webhook (`/api/webhooks/clerk`, after the Svix
 * signature check) and admin/maintenance jobs. Never use it to serve a user's
 * request — use `createServerClient()` so RLS applies.
 *
 * `import "server-only"` makes `next build` fail if this module is imported
 * from a client component, and `SUPABASE_SERVICE_ROLE_KEY` has no
 * `NEXT_PUBLIC_` prefix, so it is never inlined into the browser bundle.
 *
 * @throws {Error} When `NEXT_PUBLIC_SUPABASE_URL` or
 *   `SUPABASE_SERVICE_ROLE_KEY` is missing.
 */
export function createAdminClient(): TypedSupabaseClient {
  const serviceRoleKey = required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  return createClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
