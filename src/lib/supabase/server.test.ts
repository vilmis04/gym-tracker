// @vitest-environment node
import { auth } from "@clerk/nextjs/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  stubSupabaseFetch,
  TEST_SUPABASE_ANON_KEY,
} from "@tests/helpers/supabase-fetch";

import { createServerClient } from "./server";

const { getToken } = vi.hoisted(() => ({
  getToken: vi.fn(async (): Promise<string | null> => null),
}));

// Only `getToken` of Clerk's auth object is read.
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ getToken })),
}));

const CLERK_PUBLISHABLE_KEY =
  "pk_test_Z3ltLXRyYWNrZXIuY2xlcmsuYWNjb3VudHMuZGV2JA";

const selectProfiles = async () => {
  await createServerClient().from("profiles").select("id");
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createServerClient", () => {
  it("sends the signed-in user's Clerk session token", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", CLERK_PUBLISHABLE_KEY);
    const getAuthorizationHeaders = stubSupabaseFetch();
    getToken.mockResolvedValue("clerk-session-token");

    await selectProfiles();

    expect(getAuthorizationHeaders()).toEqual(["Bearer clerk-session-token"]);
    expect(getToken).toHaveBeenCalledWith();
  });

  it("falls back to the anon key when signed out", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", CLERK_PUBLISHABLE_KEY);
    const getAuthorizationHeaders = stubSupabaseFetch();
    getToken.mockResolvedValue(null);

    await selectProfiles();

    expect(getAuthorizationHeaders()).toEqual([
      `Bearer ${TEST_SUPABASE_ANON_KEY}`,
    ]);
  });

  it("stays signed out without calling Clerk when Clerk isn't configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    const getAuthorizationHeaders = stubSupabaseFetch();

    await selectProfiles();

    expect(getAuthorizationHeaders()).toEqual([
      `Bearer ${TEST_SUPABASE_ANON_KEY}`,
    ]);
    expect(auth).not.toHaveBeenCalled();
  });

  it("uses a given token provider instead of Clerk", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", CLERK_PUBLISHABLE_KEY);
    const getAuthorizationHeaders = stubSupabaseFetch();

    await createServerClient({ accessToken: async () => "signed-test-jwt" })
      .from("profiles")
      .select("id");

    expect(getAuthorizationHeaders()).toEqual(["Bearer signed-test-jwt"]);
    expect(auth).not.toHaveBeenCalled();
  });
});
