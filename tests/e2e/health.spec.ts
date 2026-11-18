import { expect, test } from "@playwright/test";

// E01-T06: the health check Docker/Coolify probe is public (no sign-in, no
// cookies) and reports the app version.
test("GET /api/health responds 200 without signing in", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({
    status: "ok",
    version: expect.any(String),
  });
});
