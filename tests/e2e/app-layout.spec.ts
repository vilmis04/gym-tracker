import { expect, test, type Page } from "@playwright/test";

// App layout and navigation (E02-T06): bottom navigation below 1024 px,
// sidebar from 1024 px, the avatar menu, translations and safe-area padding.
// Needs no Clerk or Supabase: the (app) pages are placeholders until E04.

const SECTIONS = [
  { path: "dashboard", en: "Home", lt: "Pradžia" },
  { path: "sessions", en: "Sessions", lt: "Treniruotės" },
  { path: "progress", en: "Progress", lt: "Pažanga" },
  { path: "buddies", en: "Buddies", lt: "Draugai" },
] as const;

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };
const IPHONE_HOME_INDICATOR_INSET = 34;
const IPHONE_NOTCH_INSET = 47;
const BOTTOM_NAV_HEIGHT = 76;

/** The visible `<nav>`: the bottom navigation or the sidebar, never both. */
const getMainNav = (page: Page, name = "Main") =>
  page.getByRole("navigation", { name });

/** Resolves a design token to the computed `rgb()` value the browser uses. */
const getTokenColor = (page: Page, token: string) =>
  page.evaluate((cssVariable) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${cssVariable})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);

/** Opens the avatar menu with the keyboard, retrying until React has hydrated. */
const openAccountMenuWithKey = async (
  page: Page,
  key: "Enter" | " ",
  name = "Account, language and theme",
) => {
  const trigger = page.getByRole("button", { name });
  await expect(async () => {
    await trigger.focus();
    await page.keyboard.press(key);
    await expect(page.getByRole("menu")).toBeVisible({ timeout: 1000 });
  }).toPass();
};

/**
 * Radix moves menu focus in a timeout after the key press, so wait for it
 * before the next key (a real user can't type that fast).
 */
const pressAndExpectFocus = async (
  page: Page,
  key: string,
  itemName: string,
) => {
  await page.keyboard.press(key);
  await expect(
    page.getByRole("menu").getByText(itemName, { exact: true }),
  ).toBeFocused();
};

test.describe("bottom navigation (< 1024 px)", () => {
  test.use({ viewport: PHONE });

  test("highlights the active section and moves between sections", async ({
    page,
  }) => {
    await page.goto("/en/sessions");
    const nav = getMainNav(page);
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveText(
      SECTIONS.map(({ en }) => en),
    );

    const primary = await getTokenColor(page, "--primary");
    const sessionsLink = nav.getByRole("link", { name: "Sessions" });
    await expect(sessionsLink).toHaveAttribute("aria-current", "page");
    await expect(sessionsLink).toHaveCSS("color", primary);
    await expect(sessionsLink).toHaveCSS("font-weight", "600");
    await expect(nav.getByRole("link", { name: "Home" })).not.toHaveCSS(
      "color",
      primary,
    );

    await nav.getByRole("link", { name: "Progress" }).click();
    await expect(page).toHaveURL("/en/progress");
    await expect(
      page.getByRole("heading", { level: 1, name: "Progress" }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: "Progress" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(sessionsLink).not.toHaveAttribute("aria-current");
  });

  test("is fixed at the bottom and clears the iPhone notch and home indicator", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Safe-area insets are emulated through the Chrome DevTools Protocol.",
    );
    const devTools = await page.context().newCDPSession(page);
    await devTools.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { top: IPHONE_NOTCH_INSET, bottom: IPHONE_HOME_INDICATOR_INSET },
    });
    await page.goto("/en/dashboard");

    const nav = getMainNav(page);
    const navBox = await nav.boundingBox();
    expect(navBox?.height).toBe(
      BOTTOM_NAV_HEIGHT + IPHONE_HOME_INDICATOR_INSET,
    );
    expect((navBox?.y ?? 0) + (navBox?.height ?? 0)).toBe(PHONE.height);

    // Every item sits above the home indicator.
    const homeIndicatorTop = PHONE.height - IPHONE_HOME_INDICATOR_INSET;
    for (const link of await nav.getByRole("link").all()) {
      const linkBox = await link.boundingBox();
      expect((linkBox?.y ?? 0) + (linkBox?.height ?? 0)).toBeLessThanOrEqual(
        homeIndicatorTop,
      );
      expect(linkBox?.height).toBeGreaterThanOrEqual(44);
    }

    // The header starts below the notch (28 px page padding + the inset).
    await expect(page.locator("main")).toHaveCSS(
      "padding-top",
      `${28 + IPHONE_NOTCH_INSET}px`,
    );

    // The page content can scroll out from under the navigation.
    await expect(page.locator("main")).toHaveCSS(
      "padding-bottom",
      `${BOTTOM_NAV_HEIGHT + IPHONE_HOME_INDICATOR_INSET + 28}px`,
    );
  });
});

test.describe("sidebar (≥ 1024 px)", () => {
  test.use({ viewport: DESKTOP });

  test("replaces the bottom navigation and highlights the active section", async ({
    page,
  }) => {
    await page.goto("/en/buddies");
    const nav = getMainNav(page);
    await expect(nav).toHaveCount(1);
    await expect(nav).toBeVisible();
    // Text only: no icons in the sidebar.
    await expect(nav.locator("svg")).toHaveCount(0);

    const buddiesLink = nav.getByRole("link", { name: "Buddies" });
    await expect(buddiesLink).toHaveAttribute("aria-current", "page");
    await expect(buddiesLink).toHaveCSS(
      "background-color",
      await getTokenColor(page, "--primary-soft"),
    );
    await expect(buddiesLink).toHaveCSS("font-weight", "600");

    const mainBox = await page.locator("main").boundingBox();
    expect(mainBox?.width).toBeLessThanOrEqual(1180);
  });
});

test.describe("layout", () => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`has no horizontal scroll at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const locale of ["en", "lt"] as const) {
        for (const { path } of [...SECTIONS, { path: "settings" }]) {
          await page.goto(`/${locale}/${path}`);
          const { scrollWidth, clientWidth } = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }));
          expect(scrollWidth, `/${locale}/${path}`).toBeLessThanOrEqual(
            clientWidth,
          );
        }
      }
    });
  }

  test("hides scroll bars, draws under the notch and answers 404 for unknown locales", async ({
    page,
  }) => {
    await page.goto("/en/dashboard");
    await expect(page.locator("html")).toHaveCSS("scrollbar-width", "none");
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      "content",
      /viewport-fit=cover/,
    );

    const response = await page.goto("/de/dashboard");
    expect(response?.status()).toBe(404);
  });

  test("the skip link moves focus to the page content", async ({ page }) => {
    await page.goto("/en/sessions");
    await expect(async () => {
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("link", { name: "Skip to content" }),
      ).toBeFocused({ timeout: 1000 });
    }).toPass();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
  });
});

test.describe("translations", () => {
  for (const locale of ["lt", "en"] as const) {
    test(`labels the navigation and pages in ${locale.toUpperCase()}`, async ({
      page,
    }) => {
      for (const section of SECTIONS) {
        await page.goto(`/${locale}/${section.path}`);
        await expect(
          page.getByRole("heading", { level: 1, name: section[locale] }),
        ).toBeVisible();
        await expect(page).toHaveTitle(`${section[locale]} · Gym Tracker`);
        await expect(page.locator("[data-app-shell]")).toHaveAttribute(
          "lang",
          locale,
        );
      }
      const navName = locale === "lt" ? "Pagrindinė" : "Main";
      await expect(getMainNav(page, navName).getByRole("link")).toHaveText(
        SECTIONS.map((section) => section[locale]),
      );
    });
  }
});

test.describe("avatar menu", () => {
  test.use({ viewport: DESKTOP });

  test("works with the keyboard: language, theme and settings", async ({
    page,
  }) => {
    await page.goto("/lt/sessions");

    // Language: the same page opens in English.
    await openAccountMenuWithKey(page, "Enter", "Paskyra, kalba ir tema");
    await expect(
      page.getByRole("menuitemradio", { name: "Lietuvių" }),
    ).toBeFocused();
    await pressAndExpectFocus(page, "ArrowDown", "English");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/en/sessions");
    await expect(
      page.getByRole("heading", { level: 1, name: "Sessions" }),
    ).toBeVisible();

    // Theme: applied at once, the menu stays open, Esc returns focus.
    await openAccountMenuWithKey(page, " ");
    for (const name of ["English", "Light", "Dark"]) {
      await pressAndExpectFocus(page, "ArrowDown", name);
    }
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(
      page.getByRole("menuitemradio", { name: "Dark" }),
    ).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Account, language and theme" }),
    ).toBeFocused();

    // Settings: a detail page whose back button leads Home.
    await openAccountMenuWithKey(page, "Enter");
    await page.keyboard.press("End");
    await expect(
      page.getByRole("menuitem", { name: "Settings" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/en/settings");
    await expect(getMainNav(page).locator('[aria-current="page"]')).toHaveCount(
      0,
    );
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL("/en/dashboard");
    await expect(
      getMainNav(page).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
