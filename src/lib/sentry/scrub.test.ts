// @vitest-environment node
import { type ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubBreadcrumb, scrubEvent, scrubString } from "./scrub";

const jwt =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoiYUBiLmNvIn0.c2lnbmF0dXJlLXZhbHVl";

describe("scrubString()", () => {
  it.each([
    ["Failed for ana.petraitiene+gym@example.co.uk", "Failed for [email]"],
    ["token: " + jwt, "token: [jwt]"],
    ["Authorization: Bearer abc.def-123", "Authorization: Bearer [Filtered]"],
    ["key sk_live_AbC123xyz leaked", "key [Filtered] leaked"],
    ["key sb_secret_AbC-123_xyz leaked", "key [Filtered] leaked"],
    [
      "/callback?code=abc123&state=ok&access_token=xyz",
      "/callback?code=[Filtered]&state=ok&access_token=[Filtered]",
    ],
  ])("scrubs %j", (input, expected) => {
    expect(scrubString(input)).toBe(expected);
  });

  it("leaves ordinary text alone", () => {
    const text =
      "Cannot read properties of undefined (reading 'reps') at /en/sessions/42";
    expect(scrubString(text)).toBe(text);
  });
});

describe("scrubEvent()", () => {
  const event: ErrorEvent = {
    type: undefined,
    message: "Login failed for jonas@example.com",
    user: {
      id: "user_123",
      email: "jonas@example.com",
      username: "jonas",
      ip_address: "1.2.3.4",
    },
    request: {
      url: `https://gym.example.lt/en/settings?token=${jwt}`,
      query_string: "invite=abc&api_key=secret",
      cookies: { __session: jwt },
      headers: {
        Authorization: `Bearer ${jwt}`,
        Cookie: `__session=${jwt}; sb-abc-auth-token=xyz`,
        "User-Agent": "Mozilla/5.0",
      },
      data: { email: "jonas@example.com", password: "hunter2", note: "hi" },
    },
    exception: {
      values: [
        {
          type: "Error",
          value: `Duplicate key for jonas@example.com (jwt ${jwt})`,
          stacktrace: {
            frames: [
              { filename: "app:///_next/server/chunks/page.js", lineno: 1 },
            ],
          },
        },
      ],
    },
    breadcrumbs: [
      { category: "console", message: "signed in as jonas@example.com" },
    ],
    extra: {
      nested: { deeper: ["call jonas@example.com"], refreshToken: "r1" },
    },
    contexts: { headers: { "x-api-key": "k-123" } },
    tags: { route: "/en/settings" },
  };

  const scrubbed = scrubEvent(structuredClone(event));
  const json = JSON.stringify(scrubbed);

  it("removes every email address", () => {
    expect(json).not.toMatch(/@example\.com/);
    expect(scrubbed.message).toBe("Login failed for [email]");
    expect(scrubbed.exception?.values?.[0]?.value).toContain("[email]");
  });

  it("removes JWTs, bearer tokens, cookies and secret fields", () => {
    expect(json).not.toContain(jwt);
    expect(json).not.toContain("eyJ");
    expect(json).not.toContain("hunter2");
    expect(json).not.toContain("xyz");
    expect(json).not.toContain("k-123");
    expect(json).not.toContain("r1");
    expect(json).not.toContain("api_key=secret");
    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.headers).toEqual({
      Authorization: "[Filtered]",
      Cookie: "[Filtered]",
      "User-Agent": "Mozilla/5.0",
    });
  });

  it("keeps only the user id", () => {
    expect(scrubbed.user).toEqual({ id: "user_123" });
  });

  it("keeps what's needed to debug", () => {
    expect(scrubbed.exception?.values?.[0]?.stacktrace).toEqual(
      event.exception?.values?.[0]?.stacktrace,
    );
    expect(scrubbed.tags).toEqual({ route: "/en/settings" });
    expect(scrubbed.request?.data).toMatchObject({ note: "hi" });
  });

  it("doesn't modify the original event", () => {
    const original = structuredClone(event);
    scrubEvent(original);
    expect(original).toEqual(event);
  });

  it("drops a user with no id entirely", () => {
    expect(
      scrubEvent({ type: undefined, user: { email: "a@b.co" } }).user,
    ).toEqual({});
  });

  it("copes with circular references", () => {
    const circular: Record<string, unknown> = { note: "a@b.co" };
    circular.self = circular;
    expect(() =>
      scrubEvent({ type: undefined, extra: { circular } }),
    ).not.toThrow();
  });
});

describe("scrubBreadcrumb()", () => {
  it("scrubs messages and data", () => {
    expect(
      scrubBreadcrumb({
        category: "fetch",
        message: "POST for a@b.co",
        data: { url: "/api?token=abc", headers: { authorization: "Bearer x" } },
      }),
    ).toEqual({
      category: "fetch",
      message: "POST for [email]",
      data: {
        url: "/api?token=[Filtered]",
        headers: { authorization: "[Filtered]" },
      },
    });
  });
});
