import { expect, test, type Page } from "@playwright/test";

// E02-T05: the NumberStepper demos on /dev/ui (see ui-components.spec.ts for
// the dev-page gate and the 44 px touch-target check).
const isDevPageServed = !process.env.CI || process.env.ENABLE_DEV_PAGES === "1";

const HOLD_SAMPLE_MS = 1000;

/** Opens /dev/ui and waits for hydration: the theme toggle checks an option only then. */
const openUiPage = async (page: Page) => {
  await page.goto("/dev/ui");
  await expect(
    page.getByRole("radio", { checked: true }).first(),
  ).toBeAttached();
};

const readValueNow = async (page: Page, name: string) =>
  Number(
    await page
      .getByRole("spinbutton", { name, exact: true })
      .getAttribute("aria-valuenow"),
  );

test.describe("NumberStepper on /dev/ui", () => {
  test.skip(
    !isDevPageServed,
    "Needs ENABLE_DEV_PAGES=1 against a production build (set in the CI e2e job)",
  );

  test("stores 57.5 for 57,5 and 57.5 and shows the locale's separator", async ({
    page,
  }) => {
    await openUiPage(page);

    const lithuanian = page.getByRole("spinbutton", { name: "Weight · LT" });
    await lithuanian.fill("60.5");
    await lithuanian.blur();
    await expect(lithuanian).toHaveValue("60,5");
    await expect(lithuanian).toHaveAttribute("aria-valuenow", "60.5");
    await expect(lithuanian).toHaveAttribute("aria-valuetext", "60,5 kg");

    const english = page.getByRole("spinbutton", { name: "Weight · EN" });
    await english.fill("60,5");
    await english.blur();
    await expect(english).toHaveValue("60.5");
    await expect(english).toHaveAttribute("aria-valuenow", "60.5");
    await expect(english).toHaveAttribute("aria-valuetext", "60.5 kg");
  });

  test("clamps on blur and reverts invalid input", async ({ page }) => {
    await openUiPage(page);

    const reps = page.getByRole("spinbutton", { name: "Reps · EN" });
    await reps.fill("0");
    await reps.blur();
    await expect(reps).toHaveValue("1");

    const weight = page.getByRole("spinbutton", { name: "Weight · EN" });
    await weight.fill("1200");
    await weight.press("Enter");
    await expect(weight).toHaveValue("999.75");

    await weight.fill("heavy");
    await weight.blur();
    await expect(weight).toHaveValue("999.75");
  });

  test("holding + repeats faster and faster and stops on release", async ({
    page,
  }) => {
    await openUiPage(page);
    const name = "Reps · LT";
    const increase = page
      .getByRole("group", { name })
      .getByRole("button", { name: "Increase by 1" });
    const startValue = await readValueNow(page, name);

    await increase.hover();
    await page.mouse.down();
    await page.waitForTimeout(HOLD_SAMPLE_MS);
    const valueAfterFirstSecond = await readValueNow(page, name);
    await page.waitForTimeout(HOLD_SAMPLE_MS);
    const valueAfterSecondSecond = await readValueNow(page, name);
    await page.mouse.up();

    const stepsInFirstSecond = valueAfterFirstSecond - startValue;
    const stepsInSecondSecond = valueAfterSecondSecond - valueAfterFirstSecond;
    expect(stepsInFirstSecond).toBeGreaterThan(3);
    expect(stepsInSecondSecond).toBeGreaterThan(stepsInFirstSecond);

    const releasedValue = await readValueNow(page, name);
    await expect(
      page.getByRole("group", { name }).getByRole("status"),
    ).toHaveText(String(releasedValue));
    await page.waitForTimeout(500);
    expect(await readValueNow(page, name)).toBe(releasedValue);
  });

  test("asks for a numeric keypad", async ({ page }) => {
    // The attribute is what makes phones show the keypad; checked on a real
    // device by hand.
    await openUiPage(page);
    await expect(
      page.getByRole("spinbutton", { name: "Weight · LT" }),
    ).toHaveAttribute("inputmode", "decimal");
    await expect(
      page.getByRole("spinbutton", { name: "Reps · LT" }),
    ).toHaveAttribute("inputmode", "numeric");
  });
});
