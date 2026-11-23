import { expect, test, type Page } from "@playwright/test";

import { hasClerkTestKeys, MISSING_CLERK_KEYS_REASON } from "./helpers/clerk";
import { e2eUser, signInAs } from "./helpers/sign-in";
import { getTokenColor } from "./helpers/tokens";

// E04-T04: the settings page and preferences that follow the user. Needs a
// signed-in user, so the file is skipped without Clerk keys. The tests share
// the e2e user's profile (its saved language and theme), so they run one
// after another and leave it at Lietuvių + System. The signed-out redirect
// of /en/settings is in sign-in.spec.ts.
test.skip(!hasClerkTestKeys(), MISSING_CLERK_KEYS_REASON);
test.describe.configure({ mode: "serial" });

const SAVED_TOAST_TEXT = { en: "Saved", lt: "Išsaugota" } as const;

// The `dark` class among others on <html>, e.g. "font-sans dark".
const DARK_CLASS_REGEX = /\bdark\b/;

// e.g. "http://localhost:3000/lt/sign-in?redirect_url=…"
const LITHUANIAN_SIGN_IN_URL_REGEX = /\/lt\/sign-in\?/;

/** Picks an option of the settings page's language or theme group. */
const pickPreference = async (page: Page, group: string, option: string) => {
  await page
    .getByRole("group", { name: group })
    .getByRole("radio", { name: option })
    .check();
};

/** Saves Lietuvių + System (the defaults) for the e2e user. */
const resetSavedPreferences = async (page: Page) => {
  await page.goto("/en/settings");
  // Picking the checked option saves nothing, so go through Light.
  await pickPreference(page, "Theme", "Light");
  await pickPreference(page, "Theme", "System");
  await expect(
    page.getByText(SAVED_TOAST_TEXT.en, { exact: true }),
  ).toBeVisible();
  await pickPreference(page, "Language", "Lietuvių");
  await expect(page).toHaveURL("/lt/settings");
  await expect(
    page.getByText(SAVED_TOAST_TEXT.lt, { exact: true }),
  ).toBeVisible();
};

test.describe("settings page", () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, e2eUser);
  });

  for (const locale of ["lt", "en"] as const) {
    test(`shows the account read-only and the sections in ${locale.toUpperCase()}`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/settings`);

      const headings = {
        lt: ["Paskyra", "Nuostatos", "Jūsų duomenys"],
        en: ["Account", "Preferences", "Your data"],
      }[locale];
      await expect(page.getByRole("heading", { level: 2 })).toHaveText(
        headings,
      );
      await expect(page.getByText(e2eUser.email.toLowerCase())).toBeVisible();
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
  }

  test("applies the theme at once and confirms it was saved", async ({
    page,
  }) => {
    await page.goto("/en/settings");

    await pickPreference(page, "Theme", "Dark");

    await expect(page.locator("html")).toHaveClass(DARK_CLASS_REGEX);
    const background = await getTokenColor(page, "--background");
    expect(
      await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      ),
    ).toBe(background);
    await expect(
      page.getByText(SAVED_TOAST_TEXT.en, { exact: true }),
    ).toBeVisible();

    await pickPreference(page, "Theme", "System");
    await expect(
      page.getByText(SAVED_TOAST_TEXT.en, { exact: true }),
    ).toHaveCount(1);
  });

  test("switches the language at once and confirms it in the new language", async ({
    page,
  }) => {
    await page.goto("/lt/settings");

    await pickPreference(page, "Kalba", "English");

    await expect(page).toHaveURL("/en/settings");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByText(SAVED_TOAST_TEXT.en, { exact: true }),
    ).toBeVisible();
    await resetSavedPreferences(page);
  });

  for (const theme of ["Light", "Dark"] as const) {
    test(`fits 360 px in both languages in the ${theme.toLowerCase()} theme`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto("/en/settings");
      await pickPreference(page, "Theme", theme);
      for (const locale of ["en", "lt"] as const) {
        await page.goto(`/${locale}/settings`);
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth, `/${locale}/settings`).toBeLessThanOrEqual(
          clientWidth,
        );
      }
      await resetSavedPreferences(page);
    });
  }

  test("signs out to the landing page", async ({ page }) => {
    await page.goto("/lt/settings");

    await page.getByRole("button", { name: "Atsijungti" }).click();

    await expect(page).toHaveURL("/lt");
    await page.goto("/lt/settings");
    await expect(page).toHaveURL(LITHUANIAN_SIGN_IN_URL_REGEX);
  });
});

test.describe("preferences across devices", () => {
  test("a language and theme saved on one device open the app that way on another", async ({
    browser,
  }) => {
    // The phone: the user picks English and Dark in the settings.
    const phone = await browser.newContext({ locale: "lt-LT" });
    const phonePage = await phone.newPage();
    await signInAs(phonePage, e2eUser, { path: "/lt/settings" });
    await pickPreference(phonePage, "Tema", "Tamsi");
    await expect(
      phonePage.getByText(SAVED_TOAST_TEXT.lt, { exact: true }),
    ).toBeVisible();
    await pickPreference(phonePage, "Kalba", "English");
    await expect(
      phonePage.getByText(SAVED_TOAST_TEXT.en, { exact: true }),
    ).toBeVisible();
    await phone.close();

    // The desktop: a Lithuanian browser that has never seen the app.
    const desktop = await browser.newContext({ locale: "lt-LT" });
    const desktopPage = await desktop.newPage();
    await signInAs(desktopPage, e2eUser, {
      path: "/lt/dashboard",
      shouldApplySavedPreferences: true,
    });

    await expect(desktopPage).toHaveURL("/en/dashboard");
    await expect(desktopPage.locator("html")).toHaveClass(DARK_CLASS_REGEX);
    const localeCookie = (await desktop.cookies()).find(
      ({ name }) => name === "NEXT_LOCALE",
    );
    expect(localeCookie?.value).toBe("en");
    // From now on this device's own choice wins: no switching back.
    await desktopPage.goto("/lt/sessions");
    await expect(desktopPage).toHaveURL("/lt/sessions");

    await resetSavedPreferences(desktopPage);
    await desktop.close();
  });
});
