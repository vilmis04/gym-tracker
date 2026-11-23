// @vitest-environment node
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { connection } from "next/server";
import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { ApplySavedPreferences } from "@/components/common/preferences/apply-saved-preferences";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";
import type { Profile } from "@/lib/profiles/profiles.types";

import { EnsureProfile } from "./ensure-profile";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ sessionId: "sess_123" })),
}));
vi.mock("@/lib/profiles/get-current-profile", () => ({
  getCurrentProfile: vi.fn(async () => null),
}));

const PROFILE: Profile = {
  id: "user_123",
  display_name: "Rūta Žemaitė",
  email: "ruta@example.com",
  avatar_url: null,
  locale: "en",
  theme: "dark",
  invite_code: "BH_3QjV5ihkxm2r5",
  clerk_updated_at: "2026-11-01T00:00:00Z",
  preferences_updated_at: "2026-11-02T00:00:00Z",
  created_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-02T00:00:00Z",
};

describe("EnsureProfile", () => {
  it("loads (and so creates) the current profile and renders nothing without one", async () => {
    expect(await EnsureProfile()).toBeNull();
    expect(connection).toHaveBeenCalledOnce();
    expect(getCurrentProfile).toHaveBeenCalledOnce();
    // Signed out / no Clerk keys: Clerk's `auth()` isn't needed.
    expect(auth).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("hands the saved language and theme with the session to ApplySavedPreferences", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValueOnce(PROFILE);

    const element = await EnsureProfile();

    expect(isValidElement(element) && element.type).toBe(ApplySavedPreferences);
    expect(isValidElement(element) && element.props).toEqual({
      sessionId: "sess_123",
      savedLocale: "en",
      savedTheme: "dark",
      hasSavedPreferences: true,
    });
  });

  it("marks a profile whose preferences were never saved", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValueOnce({
      ...PROFILE,
      preferences_updated_at: null,
    });

    const element = await EnsureProfile();

    expect(isValidElement(element) && element.props).toMatchObject({
      hasSavedPreferences: false,
    });
  });

  it("renders nothing for unexpected stored values", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValueOnce({
      ...PROFILE,
      locale: "de",
    });

    expect(await EnsureProfile()).toBeNull();
  });

  it("reports a failed sync instead of breaking the page", async () => {
    const error = new Error("Could not sync the profile");
    vi.mocked(getCurrentProfile).mockRejectedValueOnce(error);

    expect(await EnsureProfile()).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
