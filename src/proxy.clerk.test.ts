// @vitest-environment node
import { getRedirectUrl } from "next/experimental/testing/server";
import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import { afterAll, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

// Clerk reads its keys when its module loads, so they are set before the
// imports above run. The values are syntactically valid but fake: a
// signed-out request without Clerk cookies needs no call to Clerk, and with
// a production-style key (`pk_live_`) Clerk skips the development-instance
// handshake redirect. Next.js gives proxies an AsyncLocalStorage, which
// Clerk's middleware uses; plain Node needs it set on globalThis.
await vi.hoisted(async () => {
  const { AsyncLocalStorage } = await import("node:async_hooks");
  Object.assign(globalThis, { AsyncLocalStorage });
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = `pk_live_${Buffer.from(
    "clerk.gym-tracker.test$",
  ).toString("base64")}`;
  process.env.CLERK_SECRET_KEY = "fake-secret-for-unit-tests";
});

afterAll(() => {
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  delete process.env.CLERK_SECRET_KEY;
});

/** A signed-out request (no Clerk cookies), as a browser opens a page. */
const requestSignedOut = async (
  path: string,
  headers: HeadersInit = { accept: "text/html", "sec-fetch-dest": "document" },
): Promise<NextResponse> => {
  const request = new NextRequest(`http://localhost${path}`, { headers });
  const response = await proxy(request, FETCH_EVENT);
  if (!(response instanceof NextResponse))
    throw new Error("Expected the proxy to answer.");
  return response;
};

const FETCH_EVENT = { waitUntil: () => {} } as unknown as NextFetchEvent;

describe("proxy auth with Clerk", () => {
  it.each([
    ["/lt/sessions?tab=x", "/lt/sign-in"],
    ["/en/settings", "/en/sign-in"],
    ["/en/progress/session/1", "/en/sign-in"],
  ])(
    "sends signed-out %s to %s, keeping the URL to return to",
    async (path, signInPath) => {
      const response = await requestSignedOut(path);

      expect(response.status).toBe(307);
      const redirectUrl = new URL(getRedirectUrl(response) ?? "");
      expect(redirectUrl.pathname).toBe(signInPath);
      expect(redirectUrl.searchParams.get("redirect_url")).toBe(
        `http://localhost${path}`,
      );
    },
  );

  it("hides a protected API route from signed-out requests (Clerk's 404)", async () => {
    const response = await requestSignedOut("/api/sessions", {});

    expect(response.headers.get("x-clerk-auth-reason")).toContain(
      "protect-rewrite",
    );
    expect(response.headers.get("x-middleware-rewrite")).toMatch(
      /^http:\/\/localhost\/clerk_\d+$/,
    );
  });

  it.each(["/lt", "/lt/sign-in", "/en/sign-in/sso-callback", "/api/health"])(
    "serves %s signed out",
    async (path) => {
      const response = await requestSignedOut(path);

      expect(response.status).toBe(200);
      expect(getRedirectUrl(response)).toBeNull();
      expect(response.headers.get("x-clerk-auth-reason")).not.toContain(
        "protect-rewrite",
      );
      expect(response.headers.get("x-clerk-auth-status")).toBe("signed-out");
    },
  );

  it("adds the locale first, then checks sign-in on the localized URL", async () => {
    const response = await requestSignedOut("/sessions");

    expect(getRedirectUrl(response)).toBe("http://localhost/lt/sessions");
  });
});
