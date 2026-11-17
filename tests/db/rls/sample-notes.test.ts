/**
 * Example RLS test (E01-T04) for the `sample_notes` dev fixture. It shows the
 * pattern every table's RLS tests follow: act as real users through the app's
 * own Supabase client with signed JWTs, never through the service role.
 *
 * TODO(drop): delete together with the `sample_notes` fixture (see
 * supabase/migrations/20261117215612_add_sample_notes_fixture.sql).
 */
import { describe, expect, it } from "vitest";

import { createUser, type TestUser } from "../../factories";
import {
  createAnonClient,
  createClientAs,
  createServiceClient,
} from "../../helpers/supabase-auth";

async function insertNoteAs(user: TestUser, body: string) {
  const supabase = await createClientAs(user);
  const { data, error } = await supabase
    .from("sample_notes")
    .insert({ body })
    .select("id, owner_id")
    .single();
  if (error) throw error;
  return data;
}

describe("sample_notes RLS", () => {
  it("lets the owner read their own note", async () => {
    const alice = createUser();
    const note = await insertNoteAs(alice, "Alice's note");

    // owner_id defaults to the JWT `sub`, i.e. the Clerk user id.
    expect(note.owner_id).toBe(alice.id);

    const asAlice = await createClientAs(alice);
    const { data, error } = await asAlice.from("sample_notes").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([{ id: note.id }]);
  });

  it("hides user A's note from user B", async () => {
    const alice = createUser();
    const bob = createUser();
    const note = await insertNoteAs(alice, "Alice's private note");

    const asBob = await createClientAs(bob);
    const { data, error } = await asBob
      .from("sample_notes")
      .select("id")
      .eq("id", note.id);

    expect(error).toBeNull();
    expect(data).toEqual([]);

    // Sanity check: the row exists; RLS (not a failed insert) hid it.
    const { count } = await createServiceClient()
      .from("sample_notes")
      .select("id", { count: "exact", head: true })
      .eq("id", note.id);
    expect(count).toBe(1);
  });

  it("stops user B from changing or deleting user A's note", async () => {
    const alice = createUser();
    const bob = createUser();
    const note = await insertNoteAs(alice, "original");
    const asBob = await createClientAs(bob);

    const update = await asBob
      .from("sample_notes")
      .update({ body: "hacked" })
      .eq("id", note.id)
      .select("id");
    expect(update.error).toBeNull();
    expect(update.data).toEqual([]);

    const remove = await asBob
      .from("sample_notes")
      .delete()
      .eq("id", note.id)
      .select("id");
    expect(remove.error).toBeNull();
    expect(remove.data).toEqual([]);

    const { data } = await createServiceClient()
      .from("sample_notes")
      .select("body")
      .eq("id", note.id)
      .single();
    expect(data?.body).toBe("original");
  });

  it("rejects a note inserted on behalf of another user", async () => {
    const alice = createUser();
    const bob = createUser();
    const asBob = await createClientAs(bob);

    const { error } = await asBob
      .from("sample_notes")
      .insert({ body: "spoofed", owner_id: alice.id });

    // 42501 = insufficient_privilege: the insert policy's WITH CHECK failed.
    expect(error?.code).toBe("42501");
  });

  it("gives signed-out (anon) requests no rows and no inserts", async () => {
    await insertNoteAs(createUser(), "someone's note");
    const anon = createAnonClient();

    const { data, error } = await anon.from("sample_notes").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const insert = await anon.from("sample_notes").insert({ body: "anon" });
    expect(insert.error?.code).toBe("42501");
  });

  it("starts every test from an empty table", async () => {
    const { count } = await createServiceClient()
      .from("sample_notes")
      .select("id", { count: "exact", head: true });
    expect(count).toBe(0);
  });
});
