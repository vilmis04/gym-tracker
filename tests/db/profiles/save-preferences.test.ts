/**
 * `savePreferences()` (E04-T04) against local Supabase with Clerk mocked:
 * the Server Action saves the signed-in user's language and theme through
 * RLS and records that a preference was saved.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { savePreferences } from "@/lib/profiles/save-preferences";

import { createProfile, createUser, type TestUser } from "../../factories";
import {
  createServiceClient,
  signSupabaseJwt,
} from "../../helpers/supabase-auth";

const clerkServer = vi.hoisted(
  (): { userId: string | null; token: string | null } => ({
    userId: null,
    token: null,
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({
    userId: clerkServer.userId,
    getToken: async () => clerkServer.token,
  })),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const signInAs = async (user: TestUser) => {
  clerkServer.userId = user.id;
  clerkServer.token = await signSupabaseJwt(user);
};

const readProfile = async (id: string) => {
  const { data, error } = await createServiceClient()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

beforeEach(() => {
  vi.stubEnv(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "pk_test_Z3ltLXRyYWNrZXIuY2xlcmsuYWNjb3VudHMuZGV2JA",
  );
});

describe("savePreferences", () => {
  it("saves the language only, leaving the theme as it was", async () => {
    const alice = createUser();
    const profile = await createProfile(alice, { theme: "dark" });
    await signInAs(alice);

    await expect(savePreferences({ locale: "en" })).resolves.toEqual({
      ok: true,
      data: undefined,
    });

    const saved = await readProfile(alice.id);
    expect(saved).toMatchObject({ locale: "en", theme: "dark" });
    expect(saved?.preferences_updated_at).not.toBeNull();
    expect(new Date(saved?.updated_at ?? 0).getTime()).toBeGreaterThan(
      new Date(profile.updated_at).getTime(),
    );
  });

  it("saves the theme and both together", async () => {
    const alice = createUser();
    await createProfile(alice);
    await signInAs(alice);

    expect((await savePreferences({ theme: "light" })).ok).toBe(true);
    expect(await readProfile(alice.id)).toMatchObject({
      locale: "lt",
      theme: "light",
    });

    expect((await savePreferences({ locale: "en", theme: "system" })).ok).toBe(
      true,
    );
    expect(await readProfile(alice.id)).toMatchObject({
      locale: "en",
      theme: "system",
    });
  });

  it("changes only the signed-in user's profile", async () => {
    const alice = createUser();
    const bob = createUser();
    const [, bobProfile] = await Promise.all([
      createProfile(alice),
      createProfile(bob),
    ]);
    await signInAs(alice);

    await savePreferences({ locale: "en", theme: "dark" });

    expect(await readProfile(bob.id)).toEqual(bobProfile);
  });

  it("is NOT_FOUND when the user has no profile (deleted meanwhile)", async () => {
    const alice = createUser();
    await signInAs(alice);

    await expect(savePreferences({ locale: "en" })).resolves.toEqual({
      ok: false,
      error: "NOT_FOUND",
    });
    expect(await readProfile(alice.id)).toBeNull();
  });
});
