import { expect, test } from "@playwright/test";

// Smoke test (E01-T04): the placeholder home page renders on desktop and
// mobile. Needs no Clerk or Supabase.
test("home page loads", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Gym Tracker");
  await expect(
    page.getByRole("heading", { level: 1, name: "Gym Tracker" }),
  ).toBeVisible();
});
