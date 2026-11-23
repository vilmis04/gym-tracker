import { vi } from "vitest";

import type { Account } from "@/components/common/auth/auth.types";

/**
 * A signed-in `Account` for component tests: put it in
 * `<AccountContext value={createTestAccount()}>`. Every function is a spy.
 *
 * @example
 * const account = createTestAccount({ user: { name: "Ona", email: null, imageUrl: null } });
 * expect(account.signOut).toHaveBeenCalledWith("/lt");
 */
export function createTestAccount(overrides: Partial<Account> = {}): Account {
  return {
    user: {
      name: "Rūta Žemaitė",
      email: "ruta+clerk_test@example.com",
      imageUrl: null,
    },
    signOut: vi.fn(async () => {}),
    openAccountManagement: vi.fn(),
    getToken: vi.fn(async () => null),
    ...overrides,
  };
}
