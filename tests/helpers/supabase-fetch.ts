import { vi } from "vitest";

/** Settings the unit tests give the Supabase client helpers. */
export const TEST_SUPABASE_ANON_KEY = "test-anon-key";

/**
 * Points the Supabase client helpers at a fake project and answers every
 * request with an empty list, so unit tests can check which token a client
 * sends without a network. Undo with `vi.unstubAllGlobals()`.
 *
 * @example
 * const getAuthorizationHeaders = stubSupabaseFetch();
 * await createServerClient().from("sample_notes").select("id");
 * expect(getAuthorizationHeaders()).toEqual(["Bearer token"]);
 */
export function stubSupabaseFetch(): () => (string | null)[] {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", TEST_SUPABASE_ANON_KEY);
  const fetchSpy = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json([]),
  );
  vi.stubGlobal("fetch", fetchSpy);
  return () =>
    fetchSpy.mock.calls.map(([, init]) =>
      new Headers(init?.headers).get("Authorization"),
    );
}
