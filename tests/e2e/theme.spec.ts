import { expect, test, type Page } from "@playwright/test";
import { z } from "zod";

// E02-T02: light / dark / system theme. The colors are the rendered
// --background token: light hsl(37.5 44.4% 96.5%), dark hsl(36 9.8% 10%).
const LIGHT_BACKGROUND = "rgb(250, 247, 242)";
const DARK_BACKGROUND = "rgb(28, 26, 23)";

const html = (page: Page) => page.locator("html");
const body = (page: Page) => page.locator("body");
const themeColor = (page: Page) => page.locator('meta[name="theme-color"]');

test("switching the theme updates the whole page at once, without a reload", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.getByRole("radio", { name: "System" })).toBeChecked();
  // Lost on a reload, so it proves the switch happened in place.
  await page.evaluate(() => {
    document.documentElement.dataset.sameDocument = "yes";
  });

  await page.getByText("Dark", { exact: true }).click();

  await expect(html(page)).toHaveClass(/\bdark\b/);
  await expect(body(page)).toHaveCSS("background-color", DARK_BACKGROUND);
  await expect(themeColor(page)).toHaveAttribute("content", DARK_BACKGROUND);
  await expect(html(page)).toHaveAttribute("data-same-document", "yes");

  await page.getByText("Light", { exact: true }).click();

  await expect(body(page)).toHaveCSS("background-color", LIGHT_BACKGROUND);
  await expect(themeColor(page)).toHaveAttribute("content", LIGHT_BACKGROUND);
});

test("the choice survives a reload and a browser restart", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByText("Dark", { exact: true }).click();
  await expect(html(page)).toHaveClass(/\bdark\b/);

  await page.reload();
  await expect(html(page)).toHaveClass(/\bdark\b/);
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();

  // A "restart": a fresh browser context that only keeps the stored data.
  const restartedContext = await browser.newContext({
    storageState: await page.context().storageState(),
    colorScheme: "light",
  });
  const restartedPage = await restartedContext.newPage();
  await restartedPage.goto("/");
  await expect(html(restartedPage)).toHaveClass(/\bdark\b/);
  await expect(
    restartedPage.getByRole("radio", { name: "Dark" }),
  ).toBeChecked();
  await restartedContext.close();
});

test("with System, changing the OS theme updates the page live", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.getByRole("radio", { name: "System" })).toBeChecked();
  await expect(body(page)).toHaveCSS("background-color", LIGHT_BACKGROUND);

  await page.emulateMedia({ colorScheme: "dark" });

  await expect(html(page)).toHaveClass(/\bdark\b/);
  await expect(body(page)).toHaveCSS("background-color", DARK_BACKGROUND);
  await expect(themeColor(page)).toHaveAttribute("content", DARK_BACKGROUND);

  await page.emulateMedia({ colorScheme: "light" });

  await expect(html(page)).toHaveClass(/\blight\b/);
});

test("the stored dark theme is applied before any app JavaScript runs (no white flash)", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  // Without the bundles the page never hydrates: what shows is the
  // server HTML plus the inline theme scripts, i.e. the first paint of a slow
  // connection.
  await page.route("**/_next/static/**/*.js", (route) => route.abort());

  await page.goto("/");

  await expect(html(page)).toHaveClass(/\bdark\b/);
  await expect(body(page)).toHaveCSS("background-color", DARK_BACKGROUND);
  await expect(themeColor(page)).toHaveAttribute("content", DARK_BACKGROUND);
  // The toggle shows no choice until hydrated (the server can't know it).
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});

test("every frame of a slow load in the dark theme is dark", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    localStorage.setItem("theme", "dark");
    // requestAnimationFrame callbacks run right before each paint.
    const frameBackgrounds: string[] = [];
    Object.assign(window, { frameBackgrounds });
    const recordFrame = () => {
      if (document.body) {
        frameBackgrounds.push(getComputedStyle(document.body).backgroundColor);
      }
      requestAnimationFrame(recordFrame);
    };
    requestAnimationFrame(recordFrame);
  });
  // Slow bundles: the page is painted long before React hydrates.
  await page.route("**/_next/static/**/*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });

  await page.goto("/");
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked({
    timeout: 15_000,
  });

  const frameBackgrounds = z
    .array(z.string())
    .parse(await page.evaluate(() => Reflect.get(window, "frameBackgrounds")));
  expect(frameBackgrounds.length).toBeGreaterThan(0);
  expect(new Set(frameBackgrounds)).toEqual(new Set([DARK_BACKGROUND]));
});

test("the toggle works with the keyboard", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const systemOption = page.getByRole("radio", { name: "System" });
  await expect(systemOption).toBeChecked();

  await systemOption.focus();
  await page.keyboard.press("ArrowLeft");

  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Dark" })).toBeFocused();
  await expect(html(page)).toHaveClass(/\bdark\b/);
});
