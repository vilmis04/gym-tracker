import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";

import { openAccountMenuWithKey } from "./helpers/account-menu";
import { hasClerkTestKeys, MISSING_CLERK_KEYS_REASON } from "./helpers/clerk";
import { createSignInTicket, e2eUser, signInAs } from "./helpers/sign-in";
import { getTokenColor } from "./helpers/tokens";

// E04-T01: Clerk with Google sign-in and route protection (src/proxy.ts).
// The redirect to sign-in works with and without Clerk keys; everything that
// needs Clerk itself is skipped without the dev instance keys.

/** The sign-in URL's `redirect_url`, as path and query. */
const getReturnPath = (page: Page) => {
  const returnUrl = new URL(
    new URL(page.url()).searchParams.get("redirect_url") ?? "",
  );
  return `${returnUrl.pathname}${returnUrl.search}`;
};

test.describe("signed out", () => {
  test("a signed-in page sends to sign-in in its language, keeping where to return", async ({
    page,
  }) => {
    await page.goto("/lt/sessions?tab=planned");

    await expect(page).toHaveURL(/\/lt\/sign-in\?/);
    expect(getReturnPath(page)).toBe("/lt/sessions?tab=planned");
    await expect(page.locator("html")).toHaveAttribute("lang", "lt");
    await expect(page).toHaveTitle("Prisijungti · Gym Tracker");

    await page.goto("/en/settings");
    await expect(page).toHaveURL(/\/en\/sign-in\?/);
    expect(getReturnPath(page)).toBe("/en/settings");
  });

  test("without Clerk keys, sign-in says it isn't available", async ({
    page,
  }) => {
    test.skip(hasClerkTestKeys(), "Clerk is configured here.");

    await page.goto("/lt/sign-in");

    await expect(
      page.getByRole("heading", { level: 1, name: "Prisijungti" }),
    ).toBeVisible();
    await expect(
      page.getByText("Prisijungti šiuo metu negalima. Bandykite vėliau."),
    ).toBeVisible();
    await expect(page.getByRole("group", { name: "Kalba" })).toBeVisible();
  });
});

test.describe("with Clerk", () => {
  test.skip(!hasClerkTestKeys(), MISSING_CLERK_KEYS_REASON);

  test("signs in the test user without the Google consent screen", async ({
    page,
  }) => {
    await signInAs(page, e2eUser);

    const signedInEmail = await page.evaluate(
      () => window.Clerk.user?.primaryEmailAddress?.emailAddress ?? null,
    );
    expect(signedInEmail).toBe(e2eUser.email);
    await expect(page).not.toHaveURL(/accounts\.google\.com/);
  });

  test("offers only Continue with Google, in Lithuanian and English", async ({
    page,
  }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/lt/sign-in");

    await expect(
      page.getByRole("button", { name: "Tęsti su Google" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Tęsti su/ })).toHaveCount(
      1,
    );

    // E03-T02: <SignIn /> follows the language switch on the same page.
    await page
      .getByRole("group", { name: "Kalba" })
      .getByRole("radio", { name: "English" })
      .check();
    await expect(page).toHaveURL("/en/sign-in");
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
  });

  test("returns to the page that asked for sign-in", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/lt/sessions");
    await expect(page).toHaveURL(/\/lt\/sign-in\?/);

    // What Google's callback does at the end: <SignIn /> completes the
    // sign-in (here with a one-time ticket) and follows redirect_url.
    const signInUrl = new URL(page.url());
    signInUrl.searchParams.set("__clerk_ticket", await createSignInTicket());
    await page.goto(signInUrl.toString());

    await expect(page).toHaveURL("/lt/sessions");
    await expect(
      page.getByRole("heading", { level: 1, name: "Treniruotės" }),
    ).toBeVisible();
  });

  test("the sign-in card uses the theme's tokens", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await setupClerkTestingToken({ page });
    await page.goto("/en/sign-in");
    const card = page.locator(".cl-card").first();
    await expect(card).toBeVisible();

    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(card).toHaveCSS(
      "background-color",
      await getTokenColor(page, "--card"),
    );
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toHaveCSS("color", await getTokenColor(page, "--foreground"));
  });

  test.describe("signed in", () => {
    test.beforeEach(async ({ page }) => {
      await signInAs(page, e2eUser, { path: "/lt/dashboard" });
    });

    test("the avatar menu shows the user, follows the language switch and signs out to the landing page", async ({
      page,
    }) => {
      await openAccountMenuWithKey(page, "Enter", "Paskyra, kalba ir tema");
      const menu = page.getByRole("menu");
      await expect(menu).toContainText(e2eUser.email);
      await expect(
        menu.getByRole("menuitem", { name: "Atsijungti" }),
      ).toBeVisible();

      await menu.getByRole("menuitemradio", { name: "English" }).click();
      await expect(page).toHaveURL("/en/dashboard");
      await openAccountMenuWithKey(page, "Enter");
      await page.getByRole("menuitem", { name: "Sign out" }).click();

      await expect(page).toHaveURL("/en");
      await expect
        .poll(() => page.evaluate(() => window.Clerk.user ?? null))
        .toBeNull();
      await page.goto("/en/dashboard");
      await expect(page).toHaveURL(/\/en\/sign-in\?/);
    });
  });
});
