import { expect, test, type BrowserContext } from "@playwright/test";

import {
  openAccountMenuWithKey,
  pressAndExpectFocus,
} from "./helpers/account-menu";
import { signInBeforeEachTest } from "./helpers/sign-in";
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
} from "../../src/lib/i18n/locales";

// E03-T02: the LanguageSwitcher (landing page) and the avatar menu's
// language items keep the path and query, and remember the choice in the
// NEXT_LOCALE cookie, which the proxy then uses for URLs without a locale.
// Each test's browser language is the opposite of the language it switches
// to, so ending up in that language at "/" proves the cookie won.
test.use({ viewport: { width: 1440, height: 900 } });

const getLocaleCookie = async (context: BrowserContext) =>
  (await context.cookies()).find(({ name }) => name === LOCALE_COOKIE_NAME);

test.describe("in a Lithuanian browser, signed in", () => {
  test.use({ locale: "lt-LT" });
  // The avatar menu is on the signed-in pages only (E04-T01).
  signInBeforeEachTest();

  test("the avatar menu switches to English from the keyboard, keeping path and query, and EN is remembered", async ({
    page,
    context,
  }) => {
    await page.goto("/lt/sessions?tab=x");

    await openAccountMenuWithKey(page, "Enter", "Paskyra, kalba ir tema");
    await expect(
      page.getByRole("menuitemradio", { name: "Lietuvių" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("menuitemradio", { name: "English" }),
    ).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("menuitemradio", { name: "Lietuvių" }),
    ).toBeFocused();
    await pressAndExpectFocus(page, "ArrowDown", "English");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/en\/sessions\?tab=x$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", { level: 1, name: "Sessions" }),
    ).toBeVisible();
    const localeCookie = await getLocaleCookie(context);
    expect(localeCookie?.value).toBe("en");
    // Kept for a year (give or take the test's own run time).
    expect(localeCookie?.expires).toBeGreaterThan(
      Date.now() / 1000 + LOCALE_COOKIE_MAX_AGE_SECONDS - 60 * 60,
    );

    await openAccountMenuWithKey(page, "Enter");
    await expect(
      page.getByRole("menuitemradio", { name: "English" }),
    ).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");

    await page.reload();
    await expect(page).toHaveURL(/\/en\/sessions\?tab=x$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/en\/dashboard$/);
  });
});

test.describe("in an English browser", () => {
  test.use({ locale: "en-GB" });

  test("the landing page switcher works with the keyboard and marks the current language", async ({
    page,
    context,
  }) => {
    await page.goto("/en?ref=mail");
    const languageGroup = page.getByRole("group", { name: "Language" });
    await expect(
      languageGroup.getByRole("radio", { name: "English" }),
    ).toBeChecked();

    // Retry until React has hydrated and handles the arrow key.
    await expect(async () => {
      await languageGroup.getByRole("radio", { name: "English" }).focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page).toHaveURL(/\/lt\?ref=mail$/, { timeout: 1000 });
    }).toPass();

    await expect(page.locator("html")).toHaveAttribute("lang", "lt");
    await expect(
      page
        .getByRole("group", { name: "Kalba" })
        .getByRole("radio", { name: "Lietuvių" }),
    ).toBeChecked();
    expect((await getLocaleCookie(context))?.value).toBe("lt");

    await page.goto("/");
    await expect(page).toHaveURL(/\/lt$/);
  });
});
