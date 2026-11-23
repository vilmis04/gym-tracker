import { expect, test } from "@playwright/test";

// Smoke test (E01-T04): the landing page (E04-T05) renders on desktop and
// mobile. Needs no Clerk or Supabase. `/` redirects to the browser's
// language (en-US in both projects); tests/e2e/locale-routing.spec.ts covers
// the other cases.
test("home page loads", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/en$/);
  await expect(page).toHaveTitle("Gym Tracker: train together, track together");
  await expect(
    page.getByRole("heading", { level: 1, name: "Gym Tracker" }),
  ).toBeVisible();
});
