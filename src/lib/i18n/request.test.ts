// @vitest-environment node
import { locale as getLocaleRootParam } from "next/root-params";
import { describe, expect, it, vi } from "vitest";

import { MESSAGES } from "./messages";
import getRequestConfig from "./request";

import type { Locale } from "./i18n.types";

vi.mock("next/root-params", () => ({ locale: vi.fn() }));
// Vitest resolves `next-intl/server` without the `react-server` condition, to
// next-intl's stub that throws; `getRequestConfig` itself only returns its
// argument.
vi.mock("next-intl/server", () => ({
  getRequestConfig: <Config>(createConfig: Config) => createConfig,
}));

const getConfig = (requestedLocale?: Locale) =>
  getRequestConfig({
    locale: requestedLocale,
    requestLocale: Promise.resolve(undefined),
  });

describe("next-intl request config", () => {
  it("uses the [locale] root param and its messages", async () => {
    vi.mocked(getLocaleRootParam).mockResolvedValue("en");

    await expect(getConfig()).resolves.toEqual({
      locale: "en",
      messages: MESSAGES.en,
    });
  });

  it("prefers an explicit locale (getTranslations({ locale }))", async () => {
    vi.mocked(getLocaleRootParam).mockResolvedValue("en");

    await expect(getConfig("lt")).resolves.toMatchObject({ locale: "lt" });
    expect(getLocaleRootParam).not.toHaveBeenCalled();
  });

  it.each([undefined, "de"])(
    "falls back to Lithuanian for the root param %s (routes outside /[locale])",
    async (rootParam) => {
      vi.mocked(getLocaleRootParam).mockResolvedValue(rootParam);

      await expect(getConfig()).resolves.toEqual({
        locale: "lt",
        messages: MESSAGES.lt,
      });
    },
  );
});
