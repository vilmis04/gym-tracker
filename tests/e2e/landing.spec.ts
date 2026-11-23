import { expect, test, type Page } from "@playwright/test";

import { hasClerkTestKeys, MISSING_CLERK_KEYS_REASON } from "./helpers/clerk";
import { signInAs } from "./helpers/sign-in";

// E04-T05: the public landing page. Everything but the Google redirect and
// the signed-in redirect works without Clerk keys.

const LANDING_TEXT = {
  en: {
    title: "Gym Tracker: train together, track together",
    valueProposition:
      "Log your gym sessions together with your buddies and see how each of you gets stronger.",
    benefits: [
      "Train with buddies",
      "Last attempt pre-filled",
      "See your progress",
    ],
    continueWithGoogle: "Continue with Google",
    language: "Language",
    theme: "Theme",
    themeOptions: { Light: "Light", Dark: "Dark" },
  },
  lt: {
    title: "Gym Tracker: treniruokitės kartu, matykite pažangą",
    valueProposition:
      "Registruokite treniruotes kartu su draugais ir matykite, kaip kiekvienas iš jūsų stiprėja.",
    benefits: [
      "Treniruokitės su draugais",
      "Paskutinis rezultatas jau įrašytas",
      "Matykite savo pažangą",
    ],
    continueWithGoogle: "Tęsti su Google",
    language: "Kalba",
    theme: "Tema",
    themeOptions: { Light: "Šviesi", Dark: "Tamsi" },
  },
} as const;

const getContinueWithGoogle = (page: Page, locale: "en" | "lt") =>
  page
    .getByRole("button", { name: LANDING_TEXT[locale].continueWithGoogle })
    .or(
      page.getByRole("link", { name: LANDING_TEXT[locale].continueWithGoogle }),
    );

test.describe("signed out", () => {
  for (const locale of ["en", "lt"] as const) {
    test(`shows the app, its benefits and one primary action in ${locale.toUpperCase()}`, async ({
      page,
    }) => {
      const text = LANDING_TEXT[locale];

      await page.goto(`/${locale}`);

      await expect(page).toHaveTitle(text.title);
      await expect(
        page.getByRole("heading", { level: 1, name: "Gym Tracker" }),
      ).toBeVisible();
      await expect(page.getByText(text.valueProposition)).toBeVisible();
      await expect(page.getByRole("heading", { level: 3 })).toHaveText([
        ...text.benefits,
      ]);
      await expect(getContinueWithGoogle(page, locale)).toBeVisible();
      await expect(
        page.getByRole("group", { name: text.language }),
      ).toBeVisible();
      await expect(page.getByRole("group", { name: text.theme })).toBeVisible();
    });
  }

  test("has a translated Open Graph image per locale", async ({
    page,
    request,
  }) => {
    for (const locale of ["en", "lt"] as const) {
      await page.goto(`/${locale}`);
      const ogImage = page.locator('meta[property="og:image"]');
      await expect(ogImage).toHaveAttribute(
        "content",
        new RegExp(`/${locale}/og-image\\.png$`),
      );
      await expect(
        page.locator('meta[property="og:image:alt"]'),
      ).toHaveAttribute(
        "content",
        new RegExp(`^${LANDING_TEXT[locale].title}`),
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        LANDING_TEXT[locale].title,
      );

      const image = await request.get(`/${locale}/og-image.png`);
      expect(image.status()).toBe(200);
      expect(image.headers()["content-type"]).toBe("image/png");
    }
  });

  for (const theme of ["Light", "Dark"] as const) {
    test(`fits 360 px in both languages in the ${theme.toLowerCase()} theme`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      for (const locale of ["en", "lt"] as const) {
        const text = LANDING_TEXT[locale];
        await page.goto(`/${locale}`);
        // The one primary action is in view on arrival, without scrolling.
        const continueWithGoogle = getContinueWithGoogle(page, locale);
        await expect(continueWithGoogle).toBeInViewport();
        expect(
          (await continueWithGoogle.boundingBox())?.height,
        ).toBeGreaterThanOrEqual(44);

        await page
          .getByRole("group", { name: text.theme })
          .getByText(text.themeOptions[theme], { exact: true })
          .click();
        await expect(page.locator("html")).toHaveClass(
          theme === "Dark" ? /\bdark\b/ : /\blight\b/,
        );
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth, `/${locale}`).toBeLessThanOrEqual(clientWidth);
      }
    });
  }

  test("without Clerk keys, Continue with Google opens the sign-in page", async ({
    page,
  }) => {
    test.skip(hasClerkTestKeys(), "Clerk is configured here.");
    await page.goto("/en");

    await page.getByRole("link", { name: "Continue with Google" }).click();

    await expect(page).toHaveURL("/en/sign-in");
    await expect(
      page.getByText(
        "Sign-in isn’t available right now. Please try again later.",
      ),
    ).toBeVisible();
  });
});

test.describe("with Clerk", () => {
  test.skip(!hasClerkTestKeys(), MISSING_CLERK_KEYS_REASON);

  test("Continue with Google goes straight to Google in one tap", async ({
    page,
  }) => {
    // Google's page itself isn't needed (and would need a real account).
    await page.route("https://accounts.google.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "Google" }),
    );
    await page.goto("/lt");

    await page.getByRole("button", { name: "Tęsti su Google" }).click();

    await page.waitForURL(/^https:\/\/accounts\.google\.com\//);
    // Clerk passes Google its own callback, which returns to our sign-in route.
    expect(new URL(page.url()).searchParams.get("redirect_uri")).toMatch(
      /\/v1\/oauth_callback$/,
    );
  });

  test("a signed-in user opening the landing page gets Home", async ({
    page,
  }) => {
    await signInAs(page);

    for (const locale of ["lt", "en"] as const) {
      await page.goto(`/${locale}`);
      await expect(page).toHaveURL(`/${locale}/dashboard`);
    }
  });
});
