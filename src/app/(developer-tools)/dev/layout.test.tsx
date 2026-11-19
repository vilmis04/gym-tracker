// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import DevLayout from "./layout";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

const renderLayout = () =>
  DevLayout({ children: "page", params: Promise.resolve({}) });

describe("/dev layout (developer-only pages)", () => {
  it("is a 404 in production builds", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DEV_PAGES", "");

    await expect(renderLayout()).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK;404"),
    });
  });

  it("renders its pages in development or with ENABLE_DEV_PAGES=1", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await expect(renderLayout()).resolves.toBe("page");

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DEV_PAGES", "1");
    await expect(renderLayout()).resolves.toBe("page");
  });
});
