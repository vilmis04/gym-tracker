// @vitest-environment node
import { createSign } from "node:crypto";

import { getRedirectUrl } from "next/experimental/testing/server";
import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { proxy } from "./proxy";

// Clerk reads its keys when its module loads, so they are set before the
// imports above run. The values are syntactically valid but fake: a
// signed-out request without Clerk cookies needs no call to Clerk, and with
// a production-style key (`pk_live_`) Clerk skips the development-instance
// handshake redirect. A signed-in request carries a session token signed
// with a test key, whose public half the stubbed Clerk API answers with
// (`stubClerkSigningKeys`). Next.js gives proxies an AsyncLocalStorage, which Clerk's middleware uses;
// plain Node needs it set on globalThis.
const { sessionSigningKey, sessionVerificationKey } = await vi.hoisted(
  async () => {
    const [{ AsyncLocalStorage }, { generateKeyPairSync }] = await Promise.all([
      import("node:async_hooks"),
      import("node:crypto"),
    ]);
    Object.assign(globalThis, { AsyncLocalStorage });
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = `pk_live_${Buffer.from(
      "clerk.gym-tracker.test$",
    ).toString("base64")}`;
    process.env.CLERK_SECRET_KEY = "fake-secret-for-unit-tests";
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    return { sessionSigningKey: privateKey, sessionVerificationKey: publicKey };
  },
);

afterAll(() => {
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  delete process.env.CLERK_SECRET_KEY;
});

/** A signed-out request (no Clerk cookies), as a browser opens a page. */
const requestSignedOut = (
  path: string,
  headers: HeadersInit = DOCUMENT_REQUEST_HEADERS,
) => sendToProxy(path, headers);

const DOCUMENT_REQUEST_HEADERS = {
  accept: "text/html",
  "sec-fetch-dest": "document",
};

const sendToProxy = async (
  path: string,
  headers: HeadersInit,
): Promise<NextResponse> => {
  const request = new NextRequest(`http://localhost${path}`, { headers });
  const response = await proxy(request, FETCH_EVENT);
  if (!(response instanceof NextResponse))
    throw new Error("Expected the proxy to answer.");
  return response;
};

/**
 * A browser request with a valid Clerk session: the `__session` token (an
 * RS256 JWT like Clerk's) and `__client_uat`, the cookie that tells Clerk
 * the browser has signed in.
 */
const requestSignedIn = async (path: string): Promise<NextResponse> => {
  const issuedAt = Math.floor(Date.now() / 1000) - 5;
  const sessionToken = signSessionToken({
    sub: "user_landing_test",
    sid: "sess_landing_test",
    iss: "https://clerk.gym-tracker.test",
    azp: "http://localhost",
    iat: issuedAt,
    nbf: issuedAt,
    exp: issuedAt + 60,
  });
  return sendToProxy(path, {
    ...DOCUMENT_REQUEST_HEADERS,
    cookie: `__session=${sessionToken}; __client_uat=${issuedAt}`,
  });
};

/**
 * Clerk verifies session tokens with the instance's public keys, fetched
 * from its Backend API (`GET https://api.clerk.com/v1/jwks`). This answers
 * that request with the test key and refuses every other one.
 */
const stubClerkSigningKeys = () =>
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname !== "/v1/jwks") {
      throw new Error(`Unexpected request to ${url.href}`);
    }
    const key = sessionVerificationKey.export({ format: "jwk" });
    return Response.json({
      keys: [{ ...key, kid: "ins_test", alg: "RS256", use: "sig" }],
    });
  });

const signSessionToken = (claims: Record<string, string | number>) => {
  const encode = (part: object) =>
    Buffer.from(JSON.stringify(part)).toString("base64url");
  const unsignedToken = `${encode({ alg: "RS256", typ: "JWT", kid: "ins_test" })}.${encode(claims)}`;
  const signature = createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(sessionSigningKey, "base64url");
  return `${unsignedToken}.${signature}`;
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

  describe("signed in", () => {
    beforeEach(() => {
      stubClerkSigningKeys();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each([
      ["/lt", "http://localhost/lt/dashboard"],
      ["/en/", "http://localhost/en/dashboard"],
    ])(
      "sends a signed-in user from the landing page %s to Home",
      async (path, homeUrl) => {
        const response = await requestSignedIn(path);

        expect(response.status).toBe(307);
        expect(getRedirectUrl(response)).toBe(homeUrl);
      },
    );

    it("lets a signed-in user open other pages", async () => {
      const response = await requestSignedIn("/lt/sessions");

      expect(response.status).toBe(200);
      expect(getRedirectUrl(response)).toBeNull();
      // Clerk hands the auth state to the page as request headers.
      expect(
        response.headers.get("x-middleware-request-x-clerk-auth-status"),
      ).toBe("signed-in");
    });
  });

  it("adds the locale first, then checks sign-in on the localized URL", async () => {
    const response = await requestSignedOut("/sessions");

    expect(getRedirectUrl(response)).toBe("http://localhost/lt/sessions");
  });
});
