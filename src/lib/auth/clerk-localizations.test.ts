import { describe, expect, it } from "vitest";

import { CLERK_LOCALIZATIONS } from "./clerk-localizations";

describe("CLERK_LOCALIZATIONS", () => {
  it("uses Clerk's own English", () => {
    expect(CLERK_LOCALIZATIONS.en).toEqual({ locale: "en-US" });
  });

  it("translates the Google sign-in into Lithuanian with Clerk's placeholders", () => {
    const { lt } = CLERK_LOCALIZATIONS;

    expect(lt.locale).toBe("lt-LT");
    expect(lt.socialButtonsBlockButton).toBe("Tęsti su {{provider|titleize}}");
    expect(lt.signIn.start.title).toBe("Prisijunkite prie {{applicationName}}");
    expect(lt.signIn.start.titleCombined).toContain("{{applicationName}}");
  });
});
