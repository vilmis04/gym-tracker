import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { CLERK_LOCALIZATIONS } from "@/lib/auth/clerk-localizations";

import { AuthProvider } from "./auth-provider";

vi.mock("@clerk/nextjs", () => import("@tests/helpers/clerk-mock"));

const PAGE = <main>page</main>;

describe("AuthProvider", () => {
  it("renders only the page without Clerk keys", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    expect(AuthProvider({ locale: "lt", children: PAGE })).toBe(PAGE);
  });

  it.each(["lt", "en"] as const)(
    "sets up Clerk for %s: texts, sign-in, Home after sign-in, landing after sign-out",
    (locale) => {
      vi.stubEnv(
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "pk_test_Z3ltLXRyYWNrZXIuY2xlcmsuYWNjb3VudHMuZGV2JA",
      );

      const element = AuthProvider({ locale, children: PAGE });

      expect(isValidElement(element)).toBe(true);
      expect(isValidElement(element) && element.props).toMatchObject({
        localization: CLERK_LOCALIZATIONS[locale],
        signInUrl: `/${locale}/sign-in`,
        signUpUrl: `/${locale}/sign-in`,
        signInFallbackRedirectUrl: `/${locale}/dashboard`,
        signUpFallbackRedirectUrl: `/${locale}/dashboard`,
        afterSignOutUrl: `/${locale}`,
      });
    },
  );
});
