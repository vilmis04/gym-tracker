import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, LOCALE_NATIVE_NAMES, localeSchema } from "./locales";

describe("localeSchema", () => {
  it("accepts lt and en only, lt being the default", () => {
    expect(localeSchema.safeParse("lt").success).toBe(true);
    expect(localeSchema.safeParse("en").success).toBe(true);
    expect(localeSchema.safeParse("de").success).toBe(false);
    expect(localeSchema.safeParse("EN").success).toBe(false);
    expect(DEFAULT_LOCALE).toBe("lt");
    expect(LOCALE_NATIVE_NAMES).toEqual({ lt: "Lietuvių", en: "English" });
  });
});
