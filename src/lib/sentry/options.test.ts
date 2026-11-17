// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { sentryOptions } from "./options";
import { scrubBreadcrumb, scrubEvent } from "./scrub";

describe("sentryOptions()", () => {
  it("scrubs events, collects no user data and leaves release to the build", () => {
    const options = sentryOptions("http://public@127.0.0.1:1/1");

    expect(options).toMatchObject({
      dsn: "http://public@127.0.0.1:1/1",
      beforeSend: scrubEvent,
      beforeBreadcrumb: scrubBreadcrumb,
      tracesSampleRate: 0,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpBodies: [],
        urlQueryParams: false,
      },
    });
    expect(options).not.toHaveProperty("release");
    expect(options).not.toHaveProperty("environment");
  });

  it("sets the environment only when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENVIRONMENT", "preview");
    expect(sentryOptions("x").environment).toBe("preview");
  });
});
