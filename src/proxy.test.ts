// @vitest-environment node
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locales";

import { config, proxy } from "./proxy";

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
  return proxy(new NextRequest(`http://localhost${path}`, { headers }));
};

describe("proxy matcher", () => {
  it.each([
    "/",
    "/lt",
    "/en/sessions/123",
    "/sessions",
    "/de/dashboard",
    "/developers",
  ])("runs for the page path %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
  });

  it.each([
    "/api/health",
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
    const response = requestPage("/lt/sessions", {
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
