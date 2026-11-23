/**
 * Clerk ↔ Supabase integration (E04-T02): `uid()` and token verification.
 *
 * The test table `uid_fixture_notes` exists only while this file runs: it is
 * created here as the superuser (not in a migration, so it never reaches
 * staging or production) with the policy every real table uses,
 * `owner_id = (select uid())`. It isn't in the generated `Database` type, so
 * its queries use an untyped client built like the app's server client (anon
 * key + `accessToken`).
 *
 * Tokens are the ones `signSupabaseJwt()` makes: the claims of a Clerk session
 * token with the Supabase integration (`sub`, `role: authenticated`), signed
 * with the local stack's secret. Checking a real Clerk token against Clerk's
 * keys needs a Clerk instance (see docs/epics/E04-auth.md, Done (E04-T02)).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateKeyPair, SignJWT } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createUser, type TestUser } from "../../factories";
import { queryAsSuperuser } from "../../helpers/db";
import {
  createAnonClient,
  createClientAs,
  createClientWithToken,
  signSupabaseJwt,
} from "../../helpers/supabase-auth";

beforeAll(async () => {
  await queryAsSuperuser(`
    create table if not exists public.uid_fixture_notes (
      id uuid primary key default gen_random_uuid(),
      owner_id text not null default uid(),
      body text not null
    );
    alter table public.uid_fixture_notes enable row level security;
    drop policy if exists "owners read" on public.uid_fixture_notes;
    create policy "owners read" on public.uid_fixture_notes
      for select to authenticated using (owner_id = (select uid()));
    drop policy if exists "owners insert" on public.uid_fixture_notes;
    create policy "owners insert" on public.uid_fixture_notes
      for insert to authenticated with check (owner_id = (select uid()));
    notify pgrst, 'reload schema';
  `);
  await waitForFixtureTable();
});

afterAll(async () => {
  await queryAsSuperuser(`
    drop table if exists public.uid_fixture_notes;
    notify pgrst, 'reload schema';
  `);
});

describe("uid()", () => {
  it("returns the token's sub claim, the Clerk user id", async () => {
    const alice = createUser();
    const asAlice = await createClientAs(alice);

    const { data, error } = await asAlice.rpc("uid");

    expect(error).toBeNull();
    expect(data).toBe(alice.id);
  });

  it("is null for signed-out (anon) requests", async () => {
    const { data, error } = await createAnonClient().rpc("uid");

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("is stable, so Postgres may evaluate it once per statement", async () => {
    const [uidFunction] = await queryAsSuperuser<{ volatility: string }>(
      `select provolatile as volatility from pg_proc
        where oid = 'public.uid()'::regprocedure`,
    );

    // "s" = stable.
    expect(uidFunction?.volatility).toBe("s");
  });
});

describe("a table protected by owner_id = uid()", () => {
  it("gives a signed-in user only their own rows", async () => {
    const alice = createUser();
    const bob = createUser();
    const aliceNote = await insertNoteAs(alice, "Alice's note");
    await insertNoteAs(bob, "Bob's note");

    // owner_id defaults to uid(), i.e. the Clerk user id.
    expect(aliceNote.owner_id).toBe(alice.id);

    const { data, error } = await createFixtureClient(
      await signSupabaseJwt(alice),
    )
      .from("uid_fixture_notes")
      .select("id, body");
    expect(error).toBeNull();
    expect(data).toEqual([{ id: aliceNote.id, body: "Alice's note" }]);
  });

  it("rejects a row inserted for another user", async () => {
    const alice = createUser();
    const asBob = createFixtureClient(await signSupabaseJwt(createUser()));

    const { error } = await asBob
      .from("uid_fixture_notes")
      .insert({ body: "spoofed", owner_id: alice.id });

    // 42501 = insufficient_privilege: the insert policy's WITH CHECK failed.
    expect(error?.code).toBe("42501");
  });

  it("gives signed-out (anon) requests zero rows and no inserts", async () => {
    await insertNoteAs(createUser(), "someone's note");
    const anon = createFixtureClient(null);

    const { data, error } = await anon.from("uid_fixture_notes").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const insert = await anon.from("uid_fixture_notes").insert({ body: "x" });
    expect(insert.error?.code).toBe("42501");
  });

  it("treats a valid token without the authenticated role as anon", async () => {
    // A Clerk session token before the Supabase integration is activated in
    // the Clerk dashboard has no `role` claim; PostgREST then uses `anon`.
    const alice = createUser();
    await insertNoteAs(alice, "Alice's note");
    const tokenWithoutRole = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(alice.id)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(getJwtSecret()));

    const { data, error } = await createFixtureClient(tokenWithoutRole)
      .from("uid_fixture_notes")
      .select("id");

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe("token verification", () => {
  it.each([
    ["a forged signature", signWithWrongSecret, "PGRST301"],
    ["another issuer's RS256 key", signWithUnknownKey, "PGRST301"],
    ["no signature (alg: none)", createUnsignedToken, "PGRST301"],
    ["an expired token", signExpired, "PGRST303"],
  ])("rejects %s with 401", async (_label, createToken, code) => {
    const alice = createUser();
    await insertNoteAs(alice, "Alice's note");

    const { data, error, status } = await createClientWithToken(
      await createToken(alice),
    ).rpc("uid");

    expect(status).toBe(401);
    expect(error?.code).toBe(code);
    expect(data).toBeNull();
  });
});

/**
 * Untyped client for the fixture table, built like the app's server client.
 * `token` `null` = signed out.
 */
const createFixtureClient = (token: string | null): SupabaseClient => {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, anonKey, { accessToken: async () => token });
};

const insertNoteAs = async (user: TestUser, body: string) => {
  const { data, error } = await createFixtureClient(await signSupabaseJwt(user))
    .from("uid_fixture_notes")
    .insert({ body })
    .select("id, owner_id")
    .single();
  if (error) throw error;
  return data;
};

// PostgREST reloads its schema cache asynchronously after `notify pgrst`.
const waitForFixtureTable = async () => {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const { error } = await createFixtureClient(null)
      .from("uid_fixture_notes")
      .select("id")
      .limit(1);
    if (!error) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("PostgREST did not pick up uid_fixture_notes in 10 s.");
};

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (tests/setup/db.ts).`);
  return value;
};

const getJwtSecret = () => getRequiredEnv("SUPABASE_JWT_SECRET");

const signAuthenticatedClaims = (user: TestUser) =>
  new SignJWT({ role: "authenticated" })
    .setSubject(user.id)
    .setAudience("authenticated")
    .setIssuedAt();

async function signWithWrongSecret(user: TestUser): Promise<string> {
  return signAuthenticatedClaims(user)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("1h")
    .sign(
      new TextEncoder().encode(`${getJwtSecret()}-but-not-the-real-secret`),
    );
}

async function signWithUnknownKey(user: TestUser): Promise<string> {
  const { privateKey } = await generateKeyPair("RS256");
  return signAuthenticatedClaims(user)
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: "attacker-key" })
    .setExpirationTime("1h")
    .sign(privateKey);
}

async function createUnsignedToken(user: TestUser): Promise<string> {
  const [, payload] = (await signSupabaseJwt(user)).split(".");
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  return `${header}.${payload}.`;
}

async function signExpired(user: TestUser): Promise<string> {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  return signSupabaseJwt(user, { expiresIn: oneMinuteAgo });
}
