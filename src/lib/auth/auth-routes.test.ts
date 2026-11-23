// @vitest-environment node
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  getLandingPath,
  getPathLocale,
  getSignInPath,
  isApiPath,
  isProtectedPath,
} from "./auth-routes";

describe("isProtectedPath", () => {
  it("protects every section folder of the signed-in area", () => {
    const appSectionFolders = readdirSync(APP_ROUTE_GROUP_DIRECTORY, {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    expect(appSectionFolders.length).toBeGreaterThan(0);
    for (const folder of appSectionFolders) {
      expect(isProtectedPath(`/lt/${folder}`), folder).toBe(true);
    }
  });

  it.each([
    "/lt/dashboard",
    "/en/sessions",
    "/en/sessions/123",
    "/lt/progress/exercise/bench-press",
    "/lt/settings/",
    // Percent-encoded "sessions": the router decodes it, so must the check.
    "/lt/%73essions",
    // Malformed encoding: refused rather than guessed.
    "/lt/%E0%A4%A",
    "/api",
    "/api/sessions",
    "/api/health/details",
  ])("protects %s", (pathname) => {
    expect(isProtectedPath(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/lt",
    "/en/",
    "/lt/sign-in",
    "/en/sign-in/sso-callback",
    "/lt/nothing-here",
    // No locale yet: the proxy redirects to /lt/sessions, which is protected.
    "/sessions",
    "/de/dashboard",
    "/api/health",
    "/api/webhooks/clerk",
  ])("leaves %s public", (pathname) => {
    expect(isProtectedPath(pathname)).toBe(false);
  });
});

describe("isApiPath", () => {
  it.each([
    ["/api", true],
    ["/api/health", true],
    ["/apiary", false],
    ["/lt/api", false],
  ])("%s → %s", (pathname, isApi) => {
    expect(isApiPath(pathname)).toBe(isApi);
  });
});

describe("paths", () => {
  it("reads the locale of a localized path", () => {
    expect(getPathLocale("/en/sessions")).toBe("en");
    expect(getPathLocale("/lt")).toBe("lt");
    expect(getPathLocale("/sessions")).toBeUndefined();
    expect(getPathLocale("/")).toBeUndefined();
  });

  it("builds the sign-in and landing paths per locale", () => {
    expect(getSignInPath("lt")).toBe("/lt/sign-in");
    expect(getSignInPath("en")).toBe("/en/sign-in");
    expect(getLandingPath("en")).toBe("/en");
  });
});

const APP_ROUTE_GROUP_DIRECTORY = fileURLToPath(
  new URL("../../app/[locale]/(app)", import.meta.url),
);
