import { expect, test } from "@playwright/test";

import { hasClerkTestKeys, MISSING_CLERK_KEYS_REASON } from "./helpers/clerk";
import { e2eUser, signInAs } from "./helpers/sign-in";

// Example signed-in e2e test (E01-T04). Skipped until Clerk dev keys are set
// and the app loads Clerk (E04-T01); E04-T01/T02 make it a required check.
test.describe("sign-in helper", () => {
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
});
