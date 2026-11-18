/**
 * Reads the public Supabase settings shared by every client helper.
 *
 * Values are read when a client is created, not when this module is imported,
 * so `next build` works without Supabase env vars as long as nothing queries
 * the database while prerendering. The `process.env.NEXT_PUBLIC_*` references
 * must stay literal so Next.js can inline them into the browser bundle.
 *
 * Internal to `src/lib/supabase/`; app code should use the client helpers.
 */
export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  return {
    url: getSupabaseUrl(),
    anonKey: required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

/** Reads `NEXT_PUBLIC_SUPABASE_URL`; see {@link getPublicSupabaseEnv}. */
export function getSupabaseUrl(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
}

/**
 * Returns `value`, or throws an error naming the missing variable.
 *
 * @throws {Error} When the variable is unset or empty.
 */
export function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in (see README → Database).`,
    );
  }
  return value;
}
