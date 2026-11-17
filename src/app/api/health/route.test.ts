// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { GET, dynamic } from "./route";
import packageJson from "../../../../package.json";

describe("GET /api/health", () => {
  it("returns 200 with status ok and the APP_VERSION", async () => {
    vi.stubEnv("APP_VERSION", "abc1234");

    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      version: "abc1234",
    });
  });

  it("falls back to the package.json version when APP_VERSION is unset or empty", async () => {
    vi.stubEnv("APP_VERSION", "");

    await expect(GET().json()).resolves.toEqual({
      status: "ok",
      version: packageJson.version,
    });
  });

  it("is rendered per request, so the version comes from the runtime env", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});
