// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import TestErrorPage from "./page";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

const props = (query: Record<string, string> = {}) =>
  ({
    params: Promise.resolve({}),
    searchParams: Promise.resolve(query),
  }) as PageProps<"/debug/error">;

describe("/debug/error (error-tracking test page)", () => {
  it("is a 404 unless ENABLE_TEST_ERROR_PAGE=1", async () => {
    vi.stubEnv("ENABLE_TEST_ERROR_PAGE", "");
    await expect(
      TestErrorPage(props({ throw: "server" })),
    ).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK;404"),
    });
  });

  it("throws a Server Component error on ?throw=server when enabled", async () => {
    vi.stubEnv("ENABLE_TEST_ERROR_PAGE", "1");
    await expect(TestErrorPage(props({ throw: "server" }))).rejects.toThrow(
      "Test Server Component error",
    );
    await expect(TestErrorPage(props())).resolves.toBeTruthy();
  });
});
