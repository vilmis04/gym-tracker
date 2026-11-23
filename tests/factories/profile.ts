import type { Tables, TablesInsert } from "@/types/database";

import { createUser, type TestUser } from "./user";
import { createServiceClient } from "../helpers/supabase-auth";

/**
 * Inserts a `profiles` row for `user` (a new `createUser()` by default) with
 * the service role, as the Clerk webhook would, and returns it. DB tests
 * only.
 *
 * @example
 * const alice = createUser({ displayName: "Alice" });
 * const profile = await createProfile(alice, { locale: "en" });
 */
export async function createProfile(
  user: TestUser = createUser(),
  overrides: Partial<TablesInsert<"profiles">> = {},
): Promise<Tables<"profiles">> {
  const { data, error } = await createServiceClient()
    .from("profiles")
    .insert({
      id: user.id,
      display_name: user.displayName,
      email: user.email.toLowerCase(),
      clerk_updated_at: new Date().toISOString(),
      ...overrides,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
