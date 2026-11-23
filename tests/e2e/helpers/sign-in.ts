import { createClerkClient } from "@clerk/backend";
import { clerk } from "@clerk/testing/playwright";
import { test, type Page } from "@playwright/test";

import { hasClerkTestKeys, MISSING_CLERK_KEYS_REASON } from "./clerk";

import type { TestUser } from "../../factories";

/**
 * The Clerk user e2e tests sign in as. It must exist in the Clerk **dev**
 * instance (create it once in the dashboard; see tests/README.md). The
 * `+clerk_test` suffix marks it as a Clerk test address: no real email is sent
 * and verification codes are always `424242`.
 */
export const e2eUser: Pick<TestUser, "email"> = {
  // `||`, not `??`: CI passes an unset repository variable as "".
  email: process.env.E2E_CLERK_USER_EMAIL || "e2e-user+clerk_test@example.com",
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
 * with `hasClerkTestKeys()`, or use `signInBeforeEachTest()`). `/` redirects
 * to the public landing page, which loads Clerk (`AuthProvider`, E04-T01).
 * Lands on `path` (default `/`) signed in.
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

/**
 * For specs of the signed-in area (every `(app)` page is behind sign-in since
 * E04-T01): skips the enclosing file or `describe` without Clerk keys, else
 * signs `user` in before each test.
 *
 * @example
 * test.describe("avatar menu", () => {
 *   signInBeforeEachTest();
 *   test("…", async ({ page }) => { await page.goto("/lt/sessions"); });
 * });
 */
export function signInBeforeEachTest(
  user: Pick<TestUser, "email"> = e2eUser,
): void {
  test.skip(!hasClerkTestKeys(), MISSING_CLERK_KEYS_REASON);
  test.beforeEach(async ({ page }) => {
    await signInAs(page, user);
  });
}

/**
 * A one-time sign-in token for `user` (Clerk Backend API, needs
 * `CLERK_SECRET_KEY`). Opening the sign-in page with `?__clerk_ticket=<token>`
 * makes `<SignIn />` complete the sign-in itself, like the end of a Google
 * sign-in, and then follow its `redirect_url`: a real test of where the
 * sign-in page sends the user, without Google.
 */
export async function createSignInTicket(
  user: Pick<TestUser, "email"> = e2eUser,
): Promise<string> {
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  const { data: users } = await clerkClient.users.getUserList({
    emailAddress: [user.email],
  });
  const clerkUser = users[0];
  if (!clerkUser)
    throw new Error(
      `No user ${user.email} in the Clerk dev instance (tests/README.md → Signing in).`,
    );
  const { token } = await clerkClient.signInTokens.createSignInToken({
    userId: clerkUser.id,
    expiresInSeconds: SIGN_IN_TICKET_LIFETIME_SECONDS,
  });
  return token;
}

const SIGN_IN_TICKET_LIFETIME_SECONDS = 120;
