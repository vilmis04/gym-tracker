/**
 * Type-level test for `createServerClient()` (E01-T03 acceptance criterion).
 * Checked by `npm run typecheck`; never rendered or bundled (nothing imports
 * it and it lives outside `src/app`).
 *
 * `ProfileName` is a regular async Server Component querying `profiles`
 * (E04-T03; it replaced the `sample_notes` dev fixture). The
 * `@ts-expect-error` lines lock in that wrong column names are type errors:
 * if inference ever broke (e.g. the client lost its `Database` generic),
 * those lines would stop erroring and typecheck would fail.
 */
import type { Tables } from "@/types/database";

import { createServerClient } from "../server";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
function assertType<T extends true>(_check?: T): void {}

export async function ProfileName() {
  const supabase = createServerClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .order("display_name");

  if (error) throw error;

  assertType<
    Equal<
      typeof profiles,
      Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url">[]
    >
  >();

  return (
    <ul>
      {profiles.map((profile) => (
        <li key={profile.id}>{profile.display_name}</li>
      ))}
    </ul>
  );
}

export async function wrongColumnNames() {
  const supabase = createServerClient();

  // Unknown table.
  // @ts-expect-error "profile" is not a table in Database["public"].
  await supabase.from("profile").select("*");

  // Unknown column in select(): the row type becomes a SelectQueryError, so
  // reading any field fails.
  const { data } = await supabase.from("profiles").select("id, name");
  // @ts-expect-error column "name" does not exist on "profiles".
  data?.map((profile) => profile.id);

  // Unknown column in a filter.
  // @ts-expect-error "user_id" is not a column (it is "id").
  await supabase.from("profiles").select("id").eq("user_id", "user_a");

  // Unknown column in an update.
  // @ts-expect-error "language" is not a column (it is "locale").
  await supabase.from("profiles").update({ language: "en" });
}
