import { expect, test, type Browser } from "@playwright/test";

import { LOCALE_COOKIE_NAME } from "../../src/lib/i18n/locales";

// E03-T01: locale routing (src/proxy.ts) and the localized root layout.
// Detection order: URL → NEXT_LOCALE cookie → Accept-Language → lt. The
// browser `locale` option sets the Accept-Language header.

const openRootIn = async (
  browser: Browser,
  {
    browserLocale,
    localeCookie,
    baseURL,
  }: { browserLocale: string; localeCookie?: string; baseURL?: string },
) => {
  const context = await browser.newContext({ locale: browserLocale });
  if (localeCookie) {
    await context.addCookies([
      {
        name: LOCALE_COOKIE_NAME,
        value: localeCookie,
        url: new URL("/", baseURL).toString(),
      },
    ]);
  }
  const page = await context.newPage();
  await page.goto("/");
  return { context, page };
};

for (const [browserLocale, expectedLocale] of [
  ["lt-LT", "lt"],
  ["en-GB", "en"],
  ["de-DE", "lt"],
] as const) {
  test(`opens / in ${expectedLocale.toUpperCase()} for a ${browserLocale} browser`, async ({
    browser,
    baseURL,
  }) => {
    const { context, page } = await openRootIn(browser, {
      browserLocale,
      baseURL,
    });

    await expect(page).toHaveURL(new URL(`/${expectedLocale}`, baseURL).href);
    await expect(page.locator("html")).toHaveAttribute("lang", expectedLocale);
    await context.close();
  });
}

test("the NEXT_LOCALE cookie wins over Accept-Language", async ({
  browser,
  baseURL,
}) => {
  const { context, page } = await openRootIn(browser, {
    browserLocale: "lt-LT",
    localeCookie: "en",
    baseURL,
  });

  await expect(page).toHaveURL(/\/en$/);
  await context.close();
});

test("the URL wins over the cookie and becomes the remembered locale", async ({
  browser,
  baseURL,
}) => {
  const { context, page } = await openRootIn(browser, {
    browserLocale: "en-US",
    localeCookie: "en",
    baseURL,
  });

  await page.goto("/lt/sign-in");
  await expect(page.locator("html")).toHaveAttribute("lang", "lt");
  const cookies = await context.cookies();
  expect(
    cookies.find((cookie) => cookie.name === LOCALE_COOKIE_NAME)?.value,
  ).toBe("lt");

  await page.goto("/");
  await expect(page).toHaveURL(/\/lt$/);
  await context.close();
});

test("keeps the path and query when adding the locale", async ({ page }) => {
  await page.goto("/sessions?tab=planned");

  // Signed out, the localized page then sends to sign-in (E04-T01), which
  // keeps it as the page to return to.
  await expect(page).toHaveURL(/\/en\/sign-in\?/);
  const returnUrl = new URL(
    new URL(page.url()).searchParams.get("redirect_url") ?? "",
  );
  expect(`${returnUrl.pathname}${returnUrl.search}`).toBe(
    "/en/sessions?tab=planned",
  );
});

test("localizes the title, meta description and client components", async ({
  page,
}) => {
  for (const { locale, description, themeLegend } of [
    {
      locale: "lt",
      description:
        "Registruokite treniruotes kartu su savo treniruočių draugais.",
      themeLegend: "Tema",
    },
    {
      locale: "en",
      description: "Track gym sessions together with your gym buddies.",
      themeLegend: "Theme",
    },
  ]) {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page).toHaveTitle("Gym Tracker");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      description,
    );
    // ThemeToggle is a client component (useTranslations).
    await expect(page.getByRole("group", { name: themeLegend })).toBeVisible();
  }
});

test("an unknown locale ends on the 404 page under the browser's locale", async ({
  page,
}) => {
  const response = await page.goto("/de/dashboard");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(/\/en\/de\/dashboard$/);
});

test("an unknown path shows the localized 404 page", async ({ page }) => {
  const response = await page.goto("/lt/nothing-here");

  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "lt");
  await expect(
    page.getByRole("heading", { level: 1, name: "Puslapis nerastas" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Pradžia" })).toHaveAttribute(
    "href",
    "/lt/dashboard",
  );
});
