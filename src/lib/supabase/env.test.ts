import { describe, expect, it, vi } from "vitest";

import { createAdminClient } from "./admin";
import { getPublicSupabaseEnv, required } from "./env";
import { createServerClient } from "./server";

// Example unit test (E01-T04). `server-only` is aliased to an empty module in
// vitest.config.mts, so server helpers can be imported here.
describe("required", () => {
  it("returns a set value", () => {
    expect(required("NAME", "value")).toBe("value");
  });

  it.each([undefined, ""])("throws naming the variable for %j", (value) => {
    expect(() => required("SOME_VAR", value)).toThrow(
      /Missing environment variable SOME_VAR/,
    );
  });
});

describe("Supabase env", () => {
  it("reads the public URL and anon key when a client is created", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    expect(getPublicSupabaseEnv()).toEqual({
      url: "http://127.0.0.1:54321",
      anonKey: "anon-key",
    });
    expect(() => createServerClient()).not.toThrow();
  });

  it("fails fast when the service-role key is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    expect(() => createAdminClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
