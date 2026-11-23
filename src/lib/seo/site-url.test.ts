import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl } from "./site-url";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the configured origin as a URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://gymtracker.app");

    expect(getSiteUrl()?.href).toBe("https://gymtracker.app/");
  });

  it.each(["", undefined])("is undefined when unset (%j)", (value) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);

    expect(getSiteUrl()).toBeUndefined();
  });

  it.each(["gymtracker.app", "ftp://gymtracker.app", "javascript:alert(1)"])(
    "refuses %s",
    (value) => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);

      expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
    },
  );
});
