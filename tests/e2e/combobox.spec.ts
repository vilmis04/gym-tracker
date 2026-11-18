import { devices, expect, test, type Page } from "@playwright/test";

// E02-T04: the Combobox demos on /dev/ui (see ui-components.spec.ts for the
// dev-page gate). The demo search answers after 600 ms.
const isDevPageServed = !process.env.CI || process.env.ENABLE_DEV_PAGES === "1";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const SEARCH_TIMEOUT_MS = 5000;

/** Opens /dev/ui and waits for hydration: the theme toggle checks an option only then. */
const openUiPage = async (page: Page) => {
  await page.goto("/dev/ui");
  await expect(
    page.getByRole("radio", { checked: true }).first(),
  ).toBeAttached();
};

const waitForAnimations = (page: Page, selector: string) =>
  page
    .locator(selector)
    .evaluate((element) =>
      Promise.all(
        element.getAnimations().map((animation) => animation.finished),
      ),
    );

test.describe("Combobox on /dev/ui", () => {
  test.skip(
    !isDevPageServed,
    "Needs ENABLE_DEV_PAGES=1 against a production build (set in the CI e2e job)",
  );

  test.describe("desktop popover", () => {
    test.use({ viewport: DESKTOP_VIEWPORT, isMobile: false, hasTouch: false });

    test("searches accent-insensitively, offers Create by keyboard and closes on Esc", async ({
      page,
    }) => {
      await openUiPage(page);
      const trigger = page.getByRole("button", {
        name: "Exercise Choose an exercise",
      });
      await trigger.click();

      // A popover, not a modal sheet; recent exercises before typing.
      await expect(page.getByRole("dialog", { name: "Exercise" })).toHaveCount(
        0,
      );
      const input = page.getByRole("combobox", { name: "Exercise" });
      await expect(input).toBeFocused();
      await expect(page.getByRole("option")).toHaveText([
        "ŠpaudimasBarbell",
        "spaudimas gulintBench",
        "PritūpimaiBarbell",
      ]);

      // The popover's own live region (the NumberStepper demos have theirs).
      const status = page
        .locator("[data-radix-popper-content-wrapper]")
        .getByRole("status");
      await input.pressSequentially("spaudimas");
      await expect(status).toHaveText("Loading");
      const options = page.getByRole("option");
      await expect(options).toHaveCount(3, { timeout: SEARCH_TIMEOUT_MS });
      await expect(options.locator("mark")).toHaveText([
        "Špaudimas",
        "spaudimas",
        "spaudimas",
      ]);
      await expect(status).toHaveText("3 results");
      await expect(page.getByRole("option", { name: /Create/ })).toHaveCount(0);

      await input.press("End");
      await input.pressSequentially(" su hanteliais");
      const createOption = page.getByRole("option", {
        name: "Create “spaudimas su hanteliais”",
      });
      await expect(createOption).toBeVisible({ timeout: SEARCH_TIMEOUT_MS });
      await expect(createOption).toHaveAttribute("aria-selected", "true");
      await expect(input).toHaveAttribute(
        "aria-activedescendant",
        (await createOption.getAttribute("id")) ?? "",
      );
      await input.press("Enter");

      await expect(input).toBeHidden();
      await expect(
        page.getByRole("button", {
          name: "Exercise spaudimas su hanteliais",
        }),
      ).toBeFocused();

      await page.getByRole("button", { name: /^Machine/ }).click();
      await expect(
        page.getByRole("combobox", { name: "Machine" }),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("combobox")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: /^Machine/ }),
      ).toBeFocused();
    });

    test("multi-select adds and removes chips", async ({ page }) => {
      await openUiPage(page);
      const chips = page.getByRole("list", { name: "Tags" });
      await expect(chips.getByRole("listitem")).toHaveText(["chest"]);

      await page.getByRole("button", { name: "Tags Add tag" }).click();
      const input = page.getByRole("combobox", { name: "Tags" });
      await input.pressSequentially("slaun");
      await page
        .getByRole("option", { name: "šlaunys" })
        .click({ timeout: SEARCH_TIMEOUT_MS });
      await expect(input).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(chips.getByRole("listitem")).toHaveText([
        "chest",
        "šlaunys",
      ]);

      await page.getByRole("button", { name: "Remove chest" }).click();
      await expect(chips.getByRole("listitem")).toHaveText(["šlaunys"]);
      await expect(
        page.getByRole("button", { name: "Remove šlaunys" }),
      ).toBeFocused();
    });
  });

  test.describe("phone sheet", () => {
    // iPhone 14 metrics without forcing WebKit, so it also runs on Chromium.
    const { defaultBrowserType: _browserType, ...iPhone } =
      devices["iPhone 14"];
    test.use(iPhone);

    test("opens full height with the input focused and keeps the results above a shrinking viewport", async ({
      page,
    }) => {
      await openUiPage(page);
      await page
        .getByRole("button", { name: "Exercise Choose an exercise" })
        .click();

      const sheet = page.getByRole("dialog", { name: "Exercise" });
      await expect(sheet).toBeVisible();
      await waitForAnimations(page, '[role="dialog"]');
      const input = sheet.getByRole("combobox", { name: "Exercise" });
      await expect(input).toBeFocused();

      const viewport = page.viewportSize();
      const sheetBox = await sheet.boundingBox();
      expect(Math.round(sheetBox?.y ?? -1)).toBe(0);
      expect(Math.round(sheetBox?.height ?? 0)).toBe(viewport?.height);

      await input.pressSequentially("squ");
      await expect(sheet.getByRole("option")).toHaveCount(4, {
        timeout: SEARCH_TIMEOUT_MS,
      });

      // Stand-in for the on-screen keyboard: on iOS only the visual viewport
      // shrinks; here the whole viewport does. The sheet must follow it so
      // the input and the list stay visible above the "keyboard".
      const keyboardFreeHeight = 420;
      await page.setViewportSize({
        width: viewport?.width ?? 390,
        height: keyboardFreeHeight,
      });
      await expect
        .poll(async () => Math.round((await sheet.boundingBox())?.height ?? 0))
        .toBe(keyboardFreeHeight);
      const listBox = await sheet.getByRole("listbox").boundingBox();
      expect((listBox?.y ?? 0) + (listBox?.height ?? 0)).toBeLessThanOrEqual(
        keyboardFreeHeight,
      );
      expect(listBox?.height ?? 0).toBeGreaterThan(100);
      await expect(input).toBeInViewport();
      await expect(sheet.getByRole("option").first()).toBeInViewport();
      expect(
        await page.evaluate(() =>
          getComputedStyle(document.documentElement).getPropertyValue(
            "--visual-viewport-height",
          ),
        ),
      ).toBe(`${keyboardFreeHeight}px`);

      await sheet.getByRole("option", { name: /Hack squat/ }).click();
      await expect(sheet).toBeHidden();
      await expect(
        page.getByRole("button", { name: "Exercise Hack squat" }),
      ).toBeVisible();
    });
  });
});
