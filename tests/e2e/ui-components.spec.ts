import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  hasProductionBuild,
  startProductionServer,
} from "./helpers/production-server";

// E02-T03: the base UI components on /dev/ui. /dev/* is a 404 in production
// builds unless ENABLE_DEV_PAGES=1 (set in the CI e2e job); `next dev`
// always serves it.
const isDevPageServed = !process.env.CI || process.env.ENABLE_DEV_PAGES === "1";

// --background per theme: light hsl(37.5 44.4% 96.5%), dark hsl(36 9.8% 10%).
const LIGHT_BACKGROUND = "rgb(250, 247, 242)";
const DARK_BACKGROUND = "rgb(28, 26, 23)";
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const MINIMUM_TARGET_PX = 44;

/** The rendered `--ring` color, e.g. "rgb(95, 111, 85)". */
const readRingColor = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.color = "var(--ring)";
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });

/** Opens /dev/ui and waits for hydration: the theme toggle checks an option only then. */
const openUiPage = async (page: Page) => {
  await page.goto("/dev/ui");
  await expect(
    page.getByRole("radio", { checked: true }).first(),
  ).toBeAttached();
};

/** Moves focus to the element after a key press, so `:focus-visible` applies as for Tab. */
const focusWithKeyboard = async (page: Page, locator: Locator) => {
  await page.keyboard.press("Shift");
  await locator.focus();
};

test.describe("/dev/ui", () => {
  test.skip(
    !isDevPageServed,
    "Needs ENABLE_DEV_PAGES=1 against a production build (set in the CI e2e job)",
  );

  test("renders every component in the light and the dark theme", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await openUiPage(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "UI components" }),
    ).toBeVisible();
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      LIGHT_BACKGROUND,
    );
    const primaryButton = page.getByRole("button", { name: "primary md" });
    const lightPrimary = await primaryButton.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    const avatarFill = page
      .getByRole("img", { name: "Lukas" })
      .first()
      .locator("span");
    const lightAvatarFill = await avatarFill.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );

    await page.getByText("Dark", { exact: true }).click();

    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      DARK_BACKGROUND,
    );
    await expect(primaryButton).not.toHaveCSS("background-color", lightPrimary);
    // Avatars keep their pastel fill in both themes.
    await expect(avatarFill).toHaveCSS("background-color", lightAvatarFill);
    expect(lightAvatarFill).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("keyboard focus shows the --ring focus indicator on interactive components", async ({
    page,
  }) => {
    await openUiPage(page);
    const ringColor = await readRingColor(page);

    const outlinedControls = [
      page.getByRole("button", { name: "primary md" }),
      page.getByRole("button", { name: "Delete session" }),
      page.getByRole("textbox", { name: "Name" }),
      page.getByRole("tab", { name: "Upcoming" }),
      page.getByRole("button", { name: "Remove legs" }),
      page.getByRole("button", { name: "Session actions" }),
    ];
    for (const control of outlinedControls) {
      await focusWithKeyboard(page, control);
      await expect(control).toHaveCSS("outline-style", "solid");
      await expect(control).toHaveCSS("outline-width", "2px");
      await expect(control).toHaveCSS("outline-color", ringColor);
    }

    // Segmented options draw the ring on their label (the radio is visually hidden).
    const participant = page.getByRole("radio", { name: "Jonas" });
    await focusWithKeyboard(page, participant);
    const participantLabel = page.locator("label", { has: participant });
    expect(
      await participantLabel.evaluate(
        (element) => getComputedStyle(element).boxShadow,
      ),
    ).toContain(ringColor);
  });

  test("the sheet is a bottom sheet on mobile, traps focus, closes on Esc and returns focus", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await openUiPage(page);
    const trigger = page.getByRole("button", { name: "Add exercise" });

    await focusWithKeyboard(page, trigger);
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Add exercise" });
    await expect(sheet).toBeVisible();
    await expect(
      page.getByRole("searchbox", { name: "Search exercises" }),
    ).toBeFocused();
    // Anchored to the bottom edge once the slide-in animation has finished.
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox();
        return Math.round((box?.y ?? 0) + (box?.height ?? 0));
      })
      .toBe(MOBILE_VIEWPORT.height);
    expect((await sheet.boundingBox())?.y ?? 0).toBeGreaterThan(0);

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(
        await sheet.evaluate((element) =>
          element.contains(document.activeElement),
        ),
      ).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("touch targets are at least 44 × 44 px on a phone", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await openUiPage(page);

    const tooSmall = await page
      .locator(
        "main button, main a[href], main [role='tab'], main label:has(> input[type='radio'])",
      )
      .evaluateAll(
        (elements, minimum) =>
          elements
            .map((element) => {
              const rect = element.getBoundingClientRect();
              // A transparent ::after can pad the hit area (the Chip's × button).
              const after = getComputedStyle(element, "::after");
              const isPadded =
                after.content !== "none" && after.position === "absolute";
              const outset = (value: string) =>
                isPadded ? Math.max(0, -parseFloat(value) || 0) : 0;
              const width =
                rect.width + outset(after.left) + outset(after.right);
              const height =
                rect.height + outset(after.top) + outset(after.bottom);
              return {
                name:
                  element.getAttribute("aria-label") ??
                  element.textContent?.trim() ??
                  "",
                width: Math.round(width),
                height: Math.round(height),
              };
            })
            .filter(({ width, height }) => width < minimum || height < minimum),
        MINIMUM_TARGET_PX,
      );

    expect(tooSmall).toEqual([]);

    await page.getByRole("button", { name: "Session actions" }).click();
    // Measure after the pop-in (scale) animation.
    await page
      .getByRole("menu")
      .evaluate((menu) =>
        Promise.all(
          menu.getAnimations().map((animation) => animation.finished),
        ),
      );
    const menuItemHeights = await page
      .getByRole("menuitem")
      .evaluateAll((items) =>
        items.map((item) => item.getBoundingClientRect().height),
      );
    expect(menuItemHeights.length).toBeGreaterThan(0);
    for (const height of menuItemHeights) {
      expect(height).toBeGreaterThanOrEqual(MINIMUM_TARGET_PX);
    }
  });
});

// The gate is read at runtime, so a second `next start` of the same build
// without the flag must answer 404. Needs a production build in `.next`
// (CI builds one for the e2e job; locally run `npm run build` first).
test.describe("/dev pages in a production build without ENABLE_DEV_PAGES", () => {
  test.skip(!hasProductionBuild(), "Needs a production build in .next");
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Server check, one browser is enough",
  );

  test("are not reachable (404)", async ({ request }) => {
    const environment = { ...process.env };
    delete environment.ENABLE_DEV_PAGES;
    const server = await startProductionServer({
      port: Number(process.env.E2E_PROD_CHECK_PORT ?? 3999),
      environment,
    });
    try {
      for (const path of ["/dev/ui", "/dev/tokens"]) {
        const response = await request.get(`${server.baseUrl}${path}`);
        expect(response.status(), path).toBe(404);
      }
      expect((await request.get(server.baseUrl)).status()).toBe(200);
    } finally {
      server.stop();
    }
  });
});
