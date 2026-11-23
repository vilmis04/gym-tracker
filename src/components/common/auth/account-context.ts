"use client";

import { createContext, use } from "react";

import type { Account } from "./auth.types";

/**
 * The signed-in account for app components (E04-T01). They read it with
 * `useAccount()` instead of Clerk's hooks, so they also render where Clerk
 * isn't loaded: a build without Clerk keys and unit tests (wrap the
 * component in `<AccountContext value={…}>`). `ClerkAccountProvider` fills it
 * from Clerk; without it the value is `null`.
 */
export const AccountContext = createContext<Account | null>(null);

/** `null` while Clerk loads in the browser, when signed out and without Clerk. */
export function useAccount(): Account | null {
  return use(AccountContext);
}
