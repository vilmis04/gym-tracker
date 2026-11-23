// @vitest-environment node
import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

import { savePreferences } from "./save-preferences";

// The signed-in paths run against local Supabase in
// tests/db/profiles/save-preferences.test.ts.
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: null })),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const CLERK_TEST_PUBLISHABLE_KEY =
  "pk_test_Z3ltLXRyYWNrZXIuY2xlcmsuYWNjb3VudHMuZGV2JA";

describe("savePreferences", () => {
  it("is UNAUTHORIZED without calling Clerk when Clerk isn't configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    await expect(savePreferences({ locale: "en" })).resolves.toEqual({
      ok: false,
      error: "UNAUTHORIZED",
    });
    expect(auth).not.toHaveBeenCalled();
  });

  it("is UNAUTHORIZED when signed out", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", CLERK_TEST_PUBLISHABLE_KEY);

    await expect(savePreferences({ theme: "dark" })).resolves.toEqual({
      ok: false,
      error: "UNAUTHORIZED",
    });
  });

  it.each([
    ["an unsupported locale", { locale: "de" }, { locale: "VALIDATION" }],
    ["an unsupported theme", { theme: "neon" }, { theme: "VALIDATION" }],
    ["another column", { locale: "en", email: "x@example.com" }, {}],
    ["nothing to save", {}, {}],
  ])("rejects %s before asking Clerk", async (_case, input, fields) => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", CLERK_TEST_PUBLISHABLE_KEY);

    await expect(savePreferences(input as never)).resolves.toEqual({
      ok: false,
      error: "VALIDATION",
      fields,
    });
    expect(auth).not.toHaveBeenCalled();
  });
});
