import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  stubSupabaseFetch,
  TEST_SUPABASE_ANON_KEY,
} from "@tests/helpers/supabase-fetch";

// The tab's client is module state; every test starts with a fresh module.
const importCreateBrowserClient = async () =>
  (await import("./client")).createBrowserClient;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createBrowserClient", () => {
  it("is signed out (anon key) without a token provider", async () => {
    const getAuthorizationHeaders = stubSupabaseFetch();
    const createBrowserClient = await importCreateBrowserClient();

    await createBrowserClient().from("profiles").select("id");

    expect(getAuthorizationHeaders()).toEqual([
      `Bearer ${TEST_SUPABASE_ANON_KEY}`,
    ]);
  });

  it("returns one client per tab that follows the latest session", async () => {
    const getAuthorizationHeaders = stubSupabaseFetch();
    const createBrowserClient = await importCreateBrowserClient();

    const signedOutClient = createBrowserClient();
    await signedOutClient.from("profiles").select("id");
    const signedInClient = createBrowserClient({
      accessToken: async () => "clerk-session-token",
    });
    await signedInClient.from("profiles").select("id");
    // An older reference to the same client sends the new token too.
    await signedOutClient.from("profiles").select("id");

    expect(signedInClient).toBe(signedOutClient);
    expect(getAuthorizationHeaders()).toEqual([
      `Bearer ${TEST_SUPABASE_ANON_KEY}`,
      "Bearer clerk-session-token",
      "Bearer clerk-session-token",
    ]);
  });
});
