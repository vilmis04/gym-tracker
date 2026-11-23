import { SignJWT } from "jose";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import {
  signedOutAccessToken,
  type TypedSupabaseClient,
} from "@/lib/supabase/types";

import type { TestUser } from "../factories";

type SignOptions = {
  /** Lifetime passed to jose, e.g. `"1h"`, or a past date for an expired token. */
  expiresIn?: string | number | Date;
};

/**
 * Signs a JWT that local Supabase accepts as the given user: the same claims
 * the Clerk session token carries once Clerk is a third-party auth provider
 * (E04-T02) — `sub` is the Clerk user id and `role` is `authenticated`, so
 * RLS policies using `auth.jwt()->>'sub'` see this user.
 *
 * Signed HS256 with the local stack's JWT secret (`SUPABASE_JWT_SECRET`).
 */
export async function signSupabaseJwt(
  user: Pick<TestUser, "id" | "email">,
  { expiresIn = "1h" }: SignOptions = {},
): Promise<string> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "SUPABASE_JWT_SECRET is not set; signSupabaseJwt only works in the `db` Vitest project.",
    );
  }
  return new SignJWT({
    role: "authenticated",
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
}

/**
 * Returns the app's server Supabase client acting as `user` (anon key + a
 * signed JWT), so every query goes through RLS exactly as in production.
 */
export async function createClientAs(
  user: Pick<TestUser, "id" | "email">,
): Promise<TypedSupabaseClient> {
  return createClientWithToken(await signSupabaseJwt(user));
}

/**
 * The app's server client sending `token` as is, e.g. a forged or expired
 * one (E04-T02) to check that Supabase rejects it.
 */
export function createClientWithToken(token: string): TypedSupabaseClient {
  return createServerClient({ accessToken: async () => token });
}

/**
 * The app's server client with no user token (signed out → `anon` role).
 * Explicit, because the default token provider asks Clerk (E04-T02).
 */
export function createAnonClient(): TypedSupabaseClient {
  return createServerClient({ accessToken: signedOutAccessToken });
}

/**
 * Service-role client that **bypasses RLS**. Use it only to arrange or check
 * data around the code under test, never as the actor being tested.
 */
export function createServiceClient(): TypedSupabaseClient {
  return createAdminClient();
}
