// @vitest-environment node
import { createTranslator } from "next-intl";
import { getTranslations } from "next-intl/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Locale } from "@/lib/i18n/i18n.types";
import { MESSAGES } from "@/lib/i18n/messages";

import { GET, generateStaticParams } from "./route";

vi.mock("server-only", () => ({}));
// Vitest resolves `next-intl/server` to next-intl's throwing client stub (no
// `react-server` condition); stand in with the real messages.
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

const requestImage = (locale: string) =>
  GET(new Request(`http://localhost/${locale}/og-image.png`), {
    params: Promise.resolve({ locale }),
  });

describe("GET /[locale]/og-image.png", () => {
  beforeEach(() => {
    vi.mocked(getTranslations).mockImplementation((async ({
      locale,
      namespace,
    }: {
      locale: Locale;
      namespace: "common" | "landing";
    }) =>
      createTranslator({
        locale,
        messages: MESSAGES[locale],
        namespace,
      })) as unknown as typeof getTranslations);
  });

  it("is prerendered for both locales", () => {
    expect(generateStaticParams()).toEqual([
      { locale: "lt" },
      { locale: "en" },
    ]);
  });

  it.each(["lt", "en"])("draws a 1200 × 630 PNG in %s", async (locale) => {
    const response = await requestImage(locale);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.subarray(0, 4)]).toEqual(PNG_SIGNATURE);
    const view = new DataView(bytes.buffer);
    // The IHDR chunk holds width and height at bytes 16 and 20.
    expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
  });

  it("answers 404 for anything but a locale", async () => {
    const response = await requestImage("de");

    expect(response.status).toBe(404);
  });
});
