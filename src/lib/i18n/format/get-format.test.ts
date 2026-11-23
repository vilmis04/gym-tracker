// @vitest-environment node
import { cookies } from "next/headers";
import { createTranslator } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "../messages";
import { TIME_ZONE_COOKIE_NAME } from "../time-zone";
import { getFormat, getRequestTimeZone } from "./get-format";

import type { Locale } from "../i18n.types";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
// Vitest resolves `next-intl/server` to next-intl's throwing client stub (no
// `react-server` condition); stand in for the request's locale and messages.
vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(),
  getTranslations: vi.fn(),
}));

const NOW = new Date("2026-11-19T12:00:00Z");
// 07:30 in Vilnius, 00:30 in New York.
const SESSION_START = new Date("2026-11-17T05:30:00Z");

const stubTimeZoneCookie = (value?: string) => {
  const cookieStore = {
    get: (name: string) =>
      name === TIME_ZONE_COOKIE_NAME && value !== undefined
        ? { name, value }
        : undefined,
  };
  vi.mocked(cookies).mockResolvedValue(
    cookieStore as unknown as Awaited<ReturnType<typeof cookies>>,
  );
};

describe("getFormat", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    vi.mocked(getLocale).mockResolvedValue("lt");
    vi.mocked(getTranslations).mockImplementation((async ({
      locale,
    }: {
      locale: Locale;
    }) =>
      createTranslator({
        locale,
        messages: MESSAGES[locale],
        namespace: "format",
      })) as unknown as typeof getTranslations);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats in the request's locale and the time zone cookie's zone", async () => {
    stubTimeZoneCookie("America/New_York");

    const format = await getFormat();

    expect(format.dateTime(SESSION_START)).toBe(
      "2026 m. lapkričio 17 d. 00:30",
    );
    expect(format.weight(57.5)).toBe("57,5 kg");
    expect(format.relative(SESSION_START)).toBe("prieš 2 dienas");
    expect(format.duration(75)).toBe("1 val. 15 min.");
  });

  it("takes an explicit locale", async () => {
    stubTimeZoneCookie("Europe/Vilnius");

    const format = await getFormat({ locale: "en" });

    expect(format.dateTime(SESSION_START)).toBe("November 17, 2026 at 07:30");
    expect(format.relative(SESSION_START)).toBe("2 days ago");
    expect(format.duration(75)).toBe("1 h 15 min");
    expect(getLocale).not.toHaveBeenCalled();
  });
});

describe("getRequestTimeZone", () => {
  it("reads a valid zone from the cookie", async () => {
    stubTimeZoneCookie("America/New_York");
    await expect(getRequestTimeZone()).resolves.toBe("America/New_York");
  });

  it.each([undefined, "", "Mars/Olympus_Mons", "x".repeat(65)])(
    "falls back to Europe/Vilnius for the cookie value %s",
    async (value) => {
      stubTimeZoneCookie(value);
      await expect(getRequestTimeZone()).resolves.toBe("Europe/Vilnius");
    },
  );
});
