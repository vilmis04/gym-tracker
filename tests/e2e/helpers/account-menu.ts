import { expect, type Page } from "@playwright/test";

/** Opens the avatar menu with the keyboard, retrying until React has hydrated. */
export async function openAccountMenuWithKey(
  page: Page,
  key: "Enter" | " ",
  name = "Account, language and theme",
) {
  const trigger = page.getByRole("button", { name });
  await expect(async () => {
    await trigger.focus();
    await page.keyboard.press(key);
    await expect(page.getByRole("menu")).toBeVisible({ timeout: 1000 });
  }).toPass();
}

/**
 * Radix moves menu focus in a timeout after the key press, so wait for it
 * before the next key (a real user can't type that fast).
 */
export async function pressAndExpectFocus(
  page: Page,
  key: string,
  itemName: string,
) {
  await page.keyboard.press(key);
  await expect(
    page.getByRole("menu").getByText(itemName, { exact: true }),
  ).toBeFocused();
}
