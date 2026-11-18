import { describe, expect, it, vi } from "vitest";

import { isDevPagesEnabled } from "./dev-pages";

describe("isDevPagesEnabled", () => {
  it("is on in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DEV_PAGES", "");

    expect(isDevPagesEnabled()).toBe(true);
  });

  it("is off in production unless ENABLE_DEV_PAGES=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DEV_PAGES", "");
    expect(isDevPagesEnabled()).toBe(false);

    vi.stubEnv("ENABLE_DEV_PAGES", "true");
    expect(isDevPagesEnabled()).toBe(false);

    vi.stubEnv("ENABLE_DEV_PAGES", "1");
    expect(isDevPagesEnabled()).toBe(true);
  });
});
