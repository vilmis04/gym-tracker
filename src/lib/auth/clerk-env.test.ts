import { describe, expect, it, vi } from "vitest";

import { isClerkConfigured } from "./clerk-env";

describe("isClerkConfigured", () => {
  it.each([
    "pk_test_Z3ltLXRyYWNrZXIuY2xlcmsuYWNjb3VudHMuZGV2JA",
    "pk_live_Y2xlcmsuZ3ltLXRyYWNrZXIuZXhhbXBsZSQ=",
  ])("is true for the publishable key %s", (publishableKey) => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);

    expect(isClerkConfigured()).toBe(true);
  });

  it.each([undefined, "", "pk_test_", "not-a-key", "pk_test_has spaces"])(
    "is false for %j",
    (publishableKey) => {
      vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);

      expect(isClerkConfigured()).toBe(false);
    },
  );
});
