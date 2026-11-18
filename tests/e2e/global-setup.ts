import { clerkSetup } from "@clerk/testing/playwright";

import { hasClerkTestKeys } from "./helpers/clerk";

/**
 * Playwright global setup. With Clerk dev keys present, fetches a Clerk
 * testing token (stored in `process.env.CLERK_TESTING_TOKEN` for the workers)
 * so `signInAs()` can bypass bot protection. Without keys it does nothing and
 * the sign-in tests skip themselves.
 */
export default async function globalSetup(): Promise<void> {
  if (!hasClerkTestKeys()) return;
  await clerkSetup();
}
