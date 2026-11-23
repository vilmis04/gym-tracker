// @vitest-environment node
import { auth, currentUser } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

import { getCurrentProfile } from "./get-current-profile";

// The signed-in paths run against local Supabase in
// tests/db/profiles/get-current-profile.test.ts.
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: null })),
  currentUser: vi.fn(async () => null),
}));

describe("getCurrentProfile", () => {
  it("is null without calling Clerk when Clerk isn't configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    expect(await getCurrentProfile()).toBeNull();
    expect(auth).not.toHaveBeenCalled();
  });

  it("is null when signed out", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      "pk_test_Z3ltLXRyYWNrZXIuY2xlcmsuYWNjb3VudHMuZGV2JA",
    );

    expect(await getCurrentProfile()).toBeNull();
    expect(currentUser).not.toHaveBeenCalled();
  });
});
