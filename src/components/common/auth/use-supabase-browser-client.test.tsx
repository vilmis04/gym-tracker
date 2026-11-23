import { renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  stubSupabaseFetch,
  TEST_SUPABASE_ANON_KEY,
} from "@tests/helpers/supabase-fetch";

import type { Account } from "./auth.types";

// The tab's client is module state; every test starts with fresh modules.
const importModules = async () => {
  const [{ AccountContext }, { useSupabaseBrowserClient }] = await Promise.all([
    import("./account-context"),
    import("./use-supabase-browser-client"),
  ]);
  return { AccountContext, useSupabaseBrowserClient };
};

const createAccount = (token: string): Account => ({
  user: { name: "Rūta Žemaitė", email: null, imageUrl: null },
  signOut: vi.fn(async () => {}),
  openAccountManagement: vi.fn(),
  getToken: vi.fn(async () => token),
});

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useSupabaseBrowserClient", () => {
  it("sends the account's Clerk session token", async () => {
    const getAuthorizationHeaders = stubSupabaseFetch();
    const { AccountContext, useSupabaseBrowserClient } = await importModules();
    const account = createAccount("clerk-session-token");

    const { result } = renderHook(() => useSupabaseBrowserClient(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AccountContext value={account}>{children}</AccountContext>
      ),
    });
    await result.current.from("profiles").select("id");

    expect(getAuthorizationHeaders()).toEqual(["Bearer clerk-session-token"]);
  });

  it("is signed out without an account (loading, signed out, no Clerk)", async () => {
    const getAuthorizationHeaders = stubSupabaseFetch();
    const { useSupabaseBrowserClient } = await importModules();

    const { result } = renderHook(() => useSupabaseBrowserClient());
    await result.current.from("profiles").select("id");

    expect(getAuthorizationHeaders()).toEqual([
      `Bearer ${TEST_SUPABASE_ANON_KEY}`,
    ]);
  });

  it("switches the tab's client to the new session after sign-in", async () => {
    const getAuthorizationHeaders = stubSupabaseFetch();
    const { AccountContext, useSupabaseBrowserClient } = await importModules();
    let account: Account | null = null;

    const { result, rerender } = renderHook(() => useSupabaseBrowserClient(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AccountContext value={account}>{children}</AccountContext>
      ),
    });
    const signedOutClient = result.current;
    account = createAccount("clerk-session-token");
    rerender();
    await signedOutClient.from("profiles").select("id");

    expect(result.current).toBe(signedOutClient);
    expect(getAuthorizationHeaders()).toEqual(["Bearer clerk-session-token"]);
  });
});
