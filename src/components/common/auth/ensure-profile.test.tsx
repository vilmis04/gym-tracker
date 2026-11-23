// @vitest-environment node
import * as Sentry from "@sentry/nextjs";
import { connection } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

import { EnsureProfile } from "./ensure-profile";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
vi.mock("@/lib/profiles/get-current-profile", () => ({
  getCurrentProfile: vi.fn(async () => null),
}));

describe("EnsureProfile", () => {
  it("loads (and so creates) the current profile and renders nothing", async () => {
    expect(await EnsureProfile()).toBeNull();
    expect(connection).toHaveBeenCalledOnce();
    expect(getCurrentProfile).toHaveBeenCalledOnce();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("reports a failed sync instead of breaking the page", async () => {
    const error = new Error("Could not sync the profile");
    vi.mocked(getCurrentProfile).mockRejectedValueOnce(error);

    expect(await EnsureProfile()).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
