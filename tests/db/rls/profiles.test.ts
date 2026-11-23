/**
 * RLS and column privileges of `profiles` (E04-T03): users read and update
 * only their own row, and only `locale` / `theme`; the identity columns come
 * from Clerk through the service role. Visibility to buddies (E05-T01) and
 * session co-participants (E07-T01) comes later. E04-T04:
 * `preferences_updated_at` records when the user last saved a preference.
 */
import { describe, expect, it } from "vitest";

import { THEME_PREFERENCES } from "@/components/common/theme/theme-preferences";
import { LOCALES } from "@/lib/i18n/locales";

import { createProfile, createUser } from "../../factories";
import {
  createAnonClient,
  createClientAs,
  createServiceClient,
} from "../../helpers/supabase-auth";

const readProfileAsService = async (id: string) => {
  const { data, error } = await createServiceClient()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

describe("profiles RLS", () => {
  it("lets a user read their own profile", async () => {
    const alice = createUser({ displayName: "Alice" });
    const profile = await createProfile(alice);

    const asAlice = await createClientAs(alice);
    const { data, error } = await asAlice.from("profiles").select("*");

    expect(error).toBeNull();
    expect(data).toEqual([profile]);
    expect(profile).toMatchObject({
      display_name: "Alice",
      locale: "lt",
      theme: "system",
      avatar_url: null,
    });
  });

  it("hides user B's profile from user A (before they are buddies)", async () => {
    const alice = createUser();
    const bob = createUser();
    await Promise.all([createProfile(alice), createProfile(bob)]);

    const asAlice = await createClientAs(alice);
    const { data, error } = await asAlice
      .from("profiles")
      .select("id")
      .eq("id", bob.id);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("stops user A from updating user B's profile", async () => {
    const alice = createUser();
    const bob = createUser();
    await Promise.all([createProfile(alice), createProfile(bob)]);
    const asAlice = await createClientAs(alice);

    const { data, error } = await asAlice
      .from("profiles")
      .update({ locale: "en", theme: "dark" })
      .eq("id", bob.id)
      .select("id");

    expect(error).toBeNull();
    expect(data).toEqual([]);
    expect(await readProfileAsService(bob.id)).toMatchObject({
      locale: "lt",
      theme: "system",
    });
  });

  it("lets a user change their own locale and theme", async () => {
    const alice = createUser();
    const profile = await createProfile(alice);
    const asAlice = await createClientAs(alice);

    const { data, error } = await asAlice
      .from("profiles")
      .update({ locale: "en", theme: "dark" })
      .eq("id", alice.id)
      .select("locale, theme, updated_at")
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({ locale: "en", theme: "dark" });
    expect(new Date(data?.updated_at ?? 0).getTime()).toBeGreaterThan(
      new Date(profile.updated_at).getTime(),
    );
  });

  it.each([
    ["email", { email: "attacker@example.com" }],
    ["display_name", { display_name: "Someone else" }],
    ["avatar_url", { avatar_url: "https://example.com/photo.png" }],
    ["invite_code", { invite_code: "chosen-code" }],
    ["id", { id: "user_other" }],
    [
      "preferences_updated_at",
      { preferences_updated_at: "2020-01-01T00:00:00Z" },
    ],
  ])("stops a user from changing their own %s", async (_column, change) => {
    const alice = createUser();
    const profile = await createProfile(alice);
    const asAlice = await createClientAs(alice);

    const { error } = await asAlice
      .from("profiles")
      .update(change)
      .eq("id", alice.id);

    // 42501 = insufficient_privilege: only locale and theme are granted.
    expect(error?.code).toBe("42501");
    expect(await readProfileAsService(alice.id)).toEqual(profile);
  });

  it("rejects locales and themes the app doesn't support", async () => {
    const alice = createUser();
    await createProfile(alice);
    const asAlice = await createClientAs(alice);

    const locale = await asAlice
      .from("profiles")
      .update({ locale: "de" })
      .eq("id", alice.id);
    const theme = await asAlice
      .from("profiles")
      .update({ theme: "blue" })
      .eq("id", alice.id);

    // 23514 = check_violation.
    expect(locale.error?.code).toBe("23514");
    expect(theme.error?.code).toBe("23514");
  });

  it("accepts every locale and theme the app offers", async () => {
    const alice = createUser();
    await createProfile(alice);
    const asAlice = await createClientAs(alice);

    for (const locale of LOCALES) {
      const { error } = await asAlice
        .from("profiles")
        .update({ locale })
        .eq("id", alice.id);
      expect(error).toBeNull();
    }
    for (const theme of THEME_PREFERENCES) {
      const { error } = await asAlice
        .from("profiles")
        .update({ theme })
        .eq("id", alice.id);
      expect(error).toBeNull();
    }
  });

  it("stops users from creating or deleting profiles", async () => {
    const alice = createUser();
    const asAlice = await createClientAs(alice);

    const insert = await asAlice.from("profiles").insert({
      id: alice.id,
      display_name: "Alice",
      email: alice.email,
      clerk_updated_at: new Date().toISOString(),
    });
    expect(insert.error?.code).toBe("42501");

    await createProfile(alice);
    const remove = await asAlice
      .from("profiles")
      .delete()
      .eq("id", alice.id)
      .select("id");
    expect(remove.error?.code).toBe("42501");
    expect(await readProfileAsService(alice.id)).toBeDefined();
  });

  it("gives signed-out (anon) requests nothing", async () => {
    const profile = await createProfile();
    const anon = createAnonClient();

    const select = await anon.from("profiles").select("id");
    const update = await anon
      .from("profiles")
      .update({ locale: "en" })
      .eq("id", profile.id);

    expect(select.error?.code).toBe("42501");
    expect(update.error?.code).toBe("42501");
  });

  it("keeps the sync functions and deleted_users away from users", async () => {
    const alice = createUser();
    const asAlice = await createClientAs(alice);
    const anon = createAnonClient();

    const sync = await asAlice.rpc("sync_profile_from_clerk", {
      incoming_id: alice.id,
      incoming_display_name: "Alice",
      incoming_email: alice.email,
      incoming_clerk_updated_at: new Date().toISOString(),
    });
    const remove = await anon.rpc("delete_profile_from_clerk", {
      incoming_id: alice.id,
    });
    const deletedUsers = await asAlice.from("deleted_users").select("id");

    expect(sync.error?.code).toBe("42501");
    expect(remove.error?.code).toBe("42501");
    expect(deletedUsers.error?.code).toBe("42501");
  });

  it("stores a unique URL-safe invite code and a canonical email", async () => {
    const [first, second] = await Promise.all([
      createProfile(),
      createProfile(),
    ]);

    // 16 characters of base64url, e.g. "BH_3QjV5ihkxm2r5".
    const INVITE_CODE_REGEX = /^[A-Za-z0-9_-]{16}$/;
    expect(first.invite_code).toMatch(INVITE_CODE_REGEX);
    expect(first.invite_code).not.toBe(second.invite_code);

    await expect(
      createProfile(createUser(), { email: " Mixed@Example.com" }),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      createProfile(createUser(), { email: first.email }),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("records when the user saved a preference, also the same value again", async () => {
    const alice = createUser();
    const profile = await createProfile(alice);
    const asAlice = await createClientAs(alice);
    expect(profile.preferences_updated_at).toBeNull();

    // "lt" is already the value (the default): choosing it still counts.
    const { data, error } = await asAlice
      .from("profiles")
      .update({ locale: "lt" })
      .eq("id", alice.id)
      .select("locale, preferences_updated_at")
      .single();

    expect(error).toBeNull();
    expect(data?.locale).toBe("lt");
    expect(data?.preferences_updated_at).not.toBeNull();
  });

  it("doesn't count a Clerk sync as a saved preference", async () => {
    const alice = createUser();
    const profile = await createProfile(alice, {
      clerk_updated_at: "2026-01-01T00:00:00Z",
    });

    const { error } = await createServiceClient().rpc(
      "sync_profile_from_clerk",
      {
        incoming_id: alice.id,
        incoming_display_name: "Alice Renamed",
        incoming_email: alice.email,
        incoming_clerk_updated_at: "2026-02-01T00:00:00Z",
      },
    );

    expect(error).toBeNull();
    expect(await readProfileAsService(alice.id)).toMatchObject({
      display_name: "Alice Renamed",
      preferences_updated_at: null,
    });
    expect(profile.preferences_updated_at).toBeNull();
  });
});
