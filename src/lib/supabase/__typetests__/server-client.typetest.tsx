/**
 * Type-level test for `createServerClient()` (E01-T03 acceptance criterion).
 * Checked by `npm run typecheck`; never rendered or bundled (nothing imports
 * it and it lives outside `src/app`).
 *
 * `SampleNotesList` is a regular async Server Component querying the
 * `sample_notes` dev fixture. The `@ts-expect-error` lines lock in that wrong
 * column names are type errors: if inference ever broke (e.g. the client lost
 * its `Database` generic), those lines would stop erroring and typecheck
 * would fail. Delete this file together with the `sample_notes` fixture.
 */
import type { Tables } from "@/types/database";

import { createServerClient } from "../server";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
function assertType<T extends true>(_check?: T): void {}

export async function SampleNotesList() {
  const supabase = createServerClient();
  const { data: notes, error } = await supabase
    .from("sample_notes")
    .select("id, body, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  assertType<
    Equal<
      typeof notes,
      Pick<Tables<"sample_notes">, "id" | "body" | "created_at">[]
    >
  >();

  return (
    <ul>
      {notes.map((note) => (
        <li key={note.id}>{note.body}</li>
      ))}
    </ul>
  );
}

export async function wrongColumnNames() {
  const supabase = createServerClient();

  // Unknown table.
  // @ts-expect-error "sample_notez" is not a table in Database["public"].
  await supabase.from("sample_notez").select("*");

  // Unknown column in select(): the row type becomes a SelectQueryError, so
  // reading any field fails.
  const { data } = await supabase.from("sample_notes").select("id, bodyy");
  // @ts-expect-error column "bodyy" does not exist on "sample_notes".
  data?.map((note) => note.id);

  // Unknown column in a filter.
  // @ts-expect-error "owner" is not a column (it is "owner_id").
  await supabase.from("sample_notes").select("id").eq("owner", "user_a");

  // Unknown column in an insert.
  // @ts-expect-error "text" is not a column (it is "body").
  await supabase.from("sample_notes").insert({ text: "hello" });
}
