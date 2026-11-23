// @vitest-environment node
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locales";

import { config, proxy } from "./proxy";

// Without Clerk keys (as in CI): the proxy never calls Clerk, so it answers
// synchronously. src/proxy.clerk.test.ts covers the same routes with Clerk.
const requestPage = (
  path: string,
  {
    acceptLanguage,
    localeCookie,
  }: { acceptLanguage?: string; localeCookie?: string } = {},
) => {
  const headers = new Headers();
  if (acceptLanguage) headers.set("accept-language", acceptLanguage);
  if (localeCookie)
    headers.set("cookie", `${LOCALE_COOKIE_NAME}=${localeCookie}`);
  const request = new NextRequest(`http://localhost${path}`, { headers });
  // The event is only used by Clerk's middleware.
  const response = proxy(request, NO_FETCH_EVENT);
  if (!(response instanceof NextResponse))
    throw new Error("Expected an immediate answer, without Clerk.");
  return response;
};

const NO_FETCH_EVENT = { waitUntil: () => {} } as unknown as NextFetchEvent;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
});

describe("proxy matcher", () => {
  it.each([
    "/",
    "/lt",
    "/en/sessions/123",
    "/sessions",
    "/de/dashboard",
    "/developers",
    "/api/health",
    "/api",
    "/api/webhooks/clerk",
  ])("runs for %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
  });

  it.each([
    "/_next/static/chunks/app.js",
    "/dev/ui",
    "/dev",
    "/debug/error",
    "/favicon.ico",
  ])("skips %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
  });
});

describe("proxy locale detection", () => {
  it.each([
    ["lt-LT,lt;q=0.9,en;q=0.8", "/lt"],
    ["en-GB,en;q=0.9", "/en"],
    ["de-DE,de;q=0.9", "/lt"],
    [undefined, "/lt"],
  ])("redirects / with Accept-Language %s to %s", (acceptLanguage, path) => {
    const response = requestPage("/", { acceptLanguage });

    expect(response.status).toBe(307);
    expect(getRedirectUrl(response)).toBe(`http://localhost${path}`);
  });

  it("prefers the NEXT_LOCALE cookie over Accept-Language", () => {
    const response = requestPage("/", {
      acceptLanguage: "lt",
      localeCookie: "en",
    });

    expect(getRedirectUrl(response)).toBe("http://localhost/en");
  });

  it("ignores an unsupported cookie value", () => {
    const response = requestPage("/", {
      acceptLanguage: "en",
      localeCookie: "de",
    });

    expect(getRedirectUrl(response)).toBe("http://localhost/en");
  });

  it("keeps the path and query when adding the locale", () => {
    const response = requestPage("/sessions/123?tab=sets", {
      acceptLanguage: "en",
    });

    expect(getRedirectUrl(response)).toBe(
      "http://localhost/en/sessions/123?tab=sets",
    );
  });

  it("lets the URL's locale win and remembers it in the cookie", () => {
    const response = requestPage("/lt/sign-in", {
      acceptLanguage: "en",
      localeCookie: "en",
    });

    expect(getRedirectUrl(response)).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
    const localeCookie = response.cookies.get(LOCALE_COOKIE_NAME);
    expect(localeCookie?.value).toBe("lt");
    expect(localeCookie?.maxAge).toBe(60 * 60 * 24 * 365);
  });
});

describe("proxy auth without Clerk keys", () => {
  it("sends a protected page to sign-in in its language, keeping the URL to return to", () => {
    const response = requestPage("/en/sessions/123?tab=sets");

    expect(response.status).toBe(307);
    const redirectUrl = new URL(getRedirectUrl(response) ?? "");
    expect(redirectUrl.pathname).toBe("/en/sign-in");
    expect(redirectUrl.searchParams.get("redirect_url")).toBe(
      "http://localhost/en/sessions/123?tab=sets",
    );
  });

  it("answers 404 for a protected API route", () => {
    expect(requestPage("/api/sessions").status).toBe(404);
  });

  it.each(["/api/health", "/api/webhooks/clerk"])(
    "lets the public API route %s through without a locale",
    (path) => {
      const response = requestPage(path);

      expect(getRedirectUrl(response)).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it.each(["/lt", "/lt/sign-in", "/en/sign-in/sso-callback", "/lt/nothing"])(
    "serves the public page %s",
    (path) => {
      const response = requestPage(path);

      expect(getRedirectUrl(response)).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );
});
