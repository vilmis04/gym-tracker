import { randomBytes } from "node:crypto";

/** A fake app user, shaped like the Clerk identity the app sees. */
export type TestUser = {
  /** Clerk-style user id (`user_…`); becomes the JWT `sub` claim. */
  id: string;
  /**
   * Email using Clerk's `+clerk_test` suffix, so a Clerk dev instance never
   * sends real mail and accepts the fixed code `424242`.
   */
  email: string;
  displayName: string;
};

/**
 * Builds a unique fake user. Nothing is written anywhere: the DB tests only
 * need an id to put in a signed JWT (see `createClientAs`), and once
 * `profiles` exists (E04-T03) a `createProfile(user)` factory can insert it.
 *
 * @example
 * const alice = createUser({ displayName: "Alice" });
 */
export function createUser(overrides: Partial<TestUser> = {}): TestUser {
  const suffix = randomBytes(8).toString("hex");
  const id = overrides.id ?? `user_test${suffix}`;
  return {
    id,
    email: `${id}+clerk_test@example.com`,
    displayName: `Test user ${suffix.slice(0, 4)}`,
    ...overrides,
  };
}
