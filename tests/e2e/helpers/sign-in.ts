import { clerk } from "@clerk/testing/playwright";

import type { TestUser } from "../../factories";
import type { Page } from "@playwright/test";

/**
 * The Clerk user e2e tests sign in as. It must exist in the Clerk **dev**
 * instance (create it once in the dashboard; see tests/README.md). The
 * `+clerk_test` suffix marks it as a Clerk test address: no real email is sent
 * and verification codes are always `424242`.
 */
export const e2eUser: Pick<TestUser, "email"> = {
  email: process.env.E2E_CLERK_USER_EMAIL ?? "e2e-user+clerk_test@example.com",
};

/**
 * Signs `user` in through Clerk without the Google consent screen.
 *
 * Uses `@clerk/testing`: the testing token from `clerkSetup()` (global setup)
 * bypasses bot protection, and `clerk.signIn({ emailAddress })` creates a
 * sign-in token with the Backend API and completes a `ticket` sign-in in the
 * page. This works even though the instance only enables Google, because
 * sign-in tokens don't depend on the enabled strategies.
 *
 * Needs `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (guard tests
 * with `hasClerkTestKeys()`) and a page that loads Clerk (`<ClerkProvider>`,
 * E04-T01). Lands on `path` (default `/`) signed in.
 *
 * @example
 * test.skip(!hasClerkTestKeys(), MISSING_CLERK_KEYS_REASON);
 * await signInAs(page, e2eUser);
 */
export async function signInAs(
  page: Page,
  user: Pick<TestUser, "email"> = e2eUser,
  { path = "/" }: { path?: string } = {},
): Promise<void> {
  // clerk.signIn needs a public page that has loaded Clerk.
  await page.goto("/");
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress: user.email });
  if (path !== "/") await page.goto(path);
}
