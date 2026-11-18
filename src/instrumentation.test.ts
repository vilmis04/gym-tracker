// @vitest-environment node
import * as Sentry from "@sentry/nextjs";
import { describe, expect, it, vi } from "vitest";

import { onRequestError, register } from "./instrumentation";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureRequestError: vi.fn(),
}));

describe("instrumentation register()", () => {
  it("doesn't start error tracking without a DSN", () => {
    vi.stubEnv("SENTRY_DSN", "");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    register();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("prefers the runtime SENTRY_DSN over the build-time one", () => {
    vi.stubEnv("SENTRY_DSN", "http://server@127.0.0.1:1/1");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "http://public@127.0.0.1:1/1");
    register();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "http://server@127.0.0.1:1/1" }),
    );
  });

  it("falls back to NEXT_PUBLIC_SENTRY_DSN", () => {
    vi.stubEnv("SENTRY_DSN", "");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "http://public@127.0.0.1:1/1");
    register();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "http://public@127.0.0.1:1/1" }),
    );
  });

  it("reports request errors through Sentry", () => {
    expect(onRequestError).toBe(Sentry.captureRequestError);
  });
});
