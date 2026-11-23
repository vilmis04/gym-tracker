import { screen, within } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Locale } from "@/lib/i18n/i18n.types";
import { MESSAGES } from "@/lib/i18n/messages";
import { renderWithIntl } from "@tests/helpers/render-with-intl";
import { stubAppRouterAt } from "@tests/helpers/stub-app-router";

import LandingPage, { generateMetadata } from "./page";

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));
vi.mock("@clerk/nextjs", () => import("@tests/helpers/clerk-mock"));
// Vitest resolves `next-intl/server` to next-intl's throwing client stub (no
// `react-server` condition); stand in for the request's locale and messages.
vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(),
  getTranslations: vi.fn(),
}));

const stubRequestLocale = (locale: Locale) => {
  vi.mocked(getLocale).mockResolvedValue(locale);
  vi.mocked(getTranslations).mockImplementation((async (
    namespace: "common" | "landing",
  ) =>
    createTranslator({
      locale,
      messages: MESSAGES[locale],
      namespace,
    })) as unknown as typeof getTranslations);
};

// A syntactically valid development-instance key; nothing calls Clerk here.
const FAKE_PUBLISHABLE_KEY = `pk_test_${btoa("gym-tracker.clerk.test$")}`;

// Render, then query the DOM the way a user (or screen reader) finds
// things: by role and accessible name (E01-T04).
describe("LandingPage", () => {
  beforeEach(() => {
    stubAppRouterAt("/en");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows the app name, the value proposition, three benefits and both switches", () => {
    renderWithIntl(<LandingPage />, { locale: "en" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Gym Tracker" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Log your gym sessions together with your buddies and see how each of you gets stronger.",
      ),
    ).toBeVisible();
    const benefits = within(
      screen.getByRole("region", { name: "Why Gym Tracker" }),
    ).getAllByRole("listitem");
    expect(
      benefits.map(
        (benefit) =>
          within(benefit).getByRole("heading", { level: 3 }).textContent,
      ),
    ).toEqual([
      "Train with buddies",
      "Last attempt pre-filled",
      "See your progress",
    ]);
    const preferences = screen.getByRole("region", {
      name: "Language and theme",
    });
    expect(
      within(preferences).getByRole("group", { name: "Language" }),
    ).toBeInTheDocument();
    expect(
      within(preferences).getByRole("group", { name: "Theme" }),
    ).toBeInTheDocument();
  });

  it("without Clerk keys, Continue with Google opens the sign-in page", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    renderWithIntl(<LandingPage />, { locale: "en" });

    expect(
      screen.getByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("href", "/en/sign-in");
    expect(
      screen.queryByRole("button", { name: "Continue with Google" }),
    ).not.toBeInTheDocument();
  });

  it("with Clerk, Continue with Google is a button that starts Google sign-in", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", FAKE_PUBLISHABLE_KEY);

    renderWithIntl(<LandingPage />, { locale: "en" });

    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("link", { name: "Continue with Google" }),
    ).not.toBeInTheDocument();
  });

  it("is translated into Lithuanian", () => {
    stubAppRouterAt("/lt");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    renderWithIntl(<LandingPage />, { locale: "lt" });

    expect(
      screen.getByText(
        "Registruokite treniruotes kartu su draugais ir matykite, kaip kiekvienas iš jūsų stiprėja.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 3, name: "Matykite savo pažangą" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Tęsti su Google" }),
    ).toHaveAttribute("href", "/lt/sign-in");
    expect(screen.getByRole("group", { name: "Kalba" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Šviesi" })).toBeInTheDocument();
  });
});

describe("LandingPage metadata", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("has a translated title, description and Open Graph image per locale", async () => {
    stubRequestLocale("lt");

    const metadata = await generateMetadata();

    expect(metadata.title).toEqual({
      absolute: "Gym Tracker: treniruokitės kartu, matykite pažangą",
    });
    expect(metadata.description).toMatch(/^Registruokite bendras treniruotes/);
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "Gym Tracker",
      locale: "lt_LT",
      alternateLocale: ["en_US"],
      images: [
        {
          url: "/lt/og-image.png",
          width: 1200,
          height: 630,
          alt: expect.stringMatching(/^Gym Tracker: treniruokitės kartu/),
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("links the canonical and language versions only when the site URL is known", async () => {
    stubRequestLocale("en");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect((await generateMetadata()).alternates).toBeUndefined();

    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://gymtracker.app");
    const metadata = await generateMetadata();

    expect(metadata.alternates).toEqual({
      canonical: "/en",
      languages: { lt: "/lt", en: "/en", "x-default": "/" },
    });
    expect(metadata.openGraph).toMatchObject({ url: "/en" });
  });
});
