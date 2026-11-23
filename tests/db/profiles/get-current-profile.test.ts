/**
 * `getCurrentProfile()` (E04-T03) against local Supabase with Clerk mocked:
 * the first signed-in request creates a missing profile from
 * `currentUser()` without overwriting webhook data.
 */
import { currentUser } from "@clerk/nextjs/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

import { createProfile, createUser, type TestUser } from "../../factories";
import {
  createServiceClient,
  signSupabaseJwt,
} from "../../helpers/supabase-auth";

import type { MockClerkServerState } from "../../helpers/clerk-mock.types";

const clerkServer = vi.hoisted((): MockClerkServerState => ({
  userId: null,
  token: null,
  beforeCurrentUser: null,
  user: null,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({
    userId: clerkServer.userId,
    getToken: async () => clerkServer.token,
  })),
  currentUser: vi.fn(async () => {
    await clerkServer.beforeCurrentUser?.();
    return clerkServer.user;
  }),
}));

const FIVE_SECONDS_MILLISECONDS = 5000;

const signInAs = async (
  user: TestUser,
  {
    updatedAt = Date.now(),
    email = user.email,
  }: { updatedAt?: number; email?: string | null } = {},
) => {
  clerkServer.userId = user.id;
  clerkServer.token = await signSupabaseJwt(user);
  clerkServer.beforeCurrentUser = null;
  clerkServer.user = {
    id: user.id,
    firstName: user.displayName,
    lastName: null,
    username: null,
    primaryEmailAddress: email === null ? null : { emailAddress: email },
    hasImage: true,
    imageUrl: "https://img.clerk.com/photo",
    updatedAt,
  };
};

beforeEach(() => {
  vi.stubEnv(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "pk_test_Z3ltLXRyYWNrZXIuY2xlcmsuYWNjb3VudHMuZGV2JA",
  );
});

describe("getCurrentProfile", () => {
  it("creates a brand-new user's profile on their first request", async () => {
    const user = createUser({ displayName: "Rūta" });
    await signInAs(user);
    const startedAt = performance.now();

    const profile = await getCurrentProfile();

    expect(performance.now() - startedAt).toBeLessThan(
      FIVE_SECONDS_MILLISECONDS,
    );
    expect(profile).toMatchObject({
      id: user.id,
      display_name: "Rūta",
      email: user.email.toLowerCase(),
      avatar_url: "https://img.clerk.com/photo",
      locale: "lt",
      theme: "system",
    });
  });

  it("returns an existing profile without asking Clerk", async () => {
    const user = createUser();
    const existing = await createProfile(user, { locale: "en" });
    await signInAs(user);

    expect(await getCurrentProfile()).toEqual(existing);
    expect(currentUser).not.toHaveBeenCalled();
  });

  it("keeps newer webhook data written while the fallback ran", async () => {
    const user = createUser();
    await signInAs(user, { updatedAt: Date.now() - 60_000 });
    clerkServer.beforeCurrentUser = () =>
      createProfile(user, { display_name: "From the webhook" });

    const profile = await getCurrentProfile();

    expect(profile?.display_name).toBe("From the webhook");
  });

  it("creates nothing for a user Clerk has deleted", async () => {
    const user = createUser();
    await createServiceClient().rpc("delete_profile_from_clerk", {
      incoming_id: user.id,
    });
    await signInAs(user);

    expect(await getCurrentProfile()).toBeNull();
  });

  it("creates nothing for a user without an email address", async () => {
    const user = createUser();
    await signInAs(user, { email: null });

    expect(await getCurrentProfile()).toBeNull();
  });
});
