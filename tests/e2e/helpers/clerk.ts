/**
 * Whether the Clerk dev-instance keys are available. The Clerk sign-in helper
 * and tests that need a signed-in user only run when this is true; without
 * them those tests are skipped with a clear reason (see tests/README.md).
 */
export function hasClerkTestKeys(): boolean {
  return Boolean(
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
}

export const MISSING_CLERK_KEYS_REASON =
  "Needs a signed-in user: set CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY of the Clerk dev instance (tests/README.md → Signing in).";
