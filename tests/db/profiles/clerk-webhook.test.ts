/**
 * `/api/webhooks/clerk` (E04-T03) against local Supabase: the real route,
 * Svix signature check and SQL functions, with events signed like Clerk's.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/webhooks/clerk/route";

import { createProfile, createUser, type TestUser } from "../../factories";
import {
  buildClerkUserEvent,
  createSignedClerkWebhookRequest,
  TEST_CLERK_WEBHOOK_SIGNING_SECRET,
} from "../../helpers/clerk-webhook";
import { createServiceClient } from "../../helpers/supabase-auth";

const MINUTE_MILLISECONDS = 60 * 1000;

const sendEvent = async (
  event: unknown,
  options?: Parameters<typeof createSignedClerkWebhookRequest>[1],
) => {
  const response = await POST(createSignedClerkWebhookRequest(event, options));
  return { status: response.status, body: await response.json() };
};

const readProfiles = async (user: TestUser) => {
  const { data, error } = await createServiceClient()
    .from("profiles")
    .select("*")
    .eq("id", user.id);
  if (error) throw error;
  return data;
};

beforeEach(() => {
  vi.stubEnv("CLERK_WEBHOOK_SIGNING_SECRET", TEST_CLERK_WEBHOOK_SIGNING_SECRET);
});

describe("Clerk webhook → profiles", () => {
  it("creates the profile on user.created", async () => {
    const user = createUser({ displayName: "Rūta" });

    const result = await sendEvent(
      buildClerkUserEvent("user.created", user, {
        lastName: "Žemaitė",
        imageUrl: "https://img.clerk.com/ruta",
        updatedAt: Date.UTC(2026, 10, 23, 12),
      }),
    );

    expect(result).toEqual({ status: 200, body: { status: "synced" } });
    expect(await readProfiles(user)).toEqual([
      expect.objectContaining({
        id: user.id,
        display_name: "Rūta Žemaitė",
        email: user.email.toLowerCase(),
        avatar_url: "https://img.clerk.com/ruta",
        locale: "lt",
        theme: "system",
        clerk_updated_at: "2026-11-23T12:00:00+00:00",
      }),
    ]);
  });

  it("answers 401 and writes nothing for an invalid signature", async () => {
    const user = createUser();

    const result = await sendEvent(buildClerkUserEvent("user.created", user), {
      secret: "whsec_b3RoZXItc2VjcmV0LW90aGVyLXNlY3JldA==",
    });

    expect(result.status).toBe(401);
    expect(await readProfiles(user)).toEqual([]);
  });

  it("gives the same result when the same event is delivered twice", async () => {
    const user = createUser();
    const event = buildClerkUserEvent("user.created", user);
    const delivery = { messageId: "msg_replayed", timestamp: new Date() };

    const first = await sendEvent(event, delivery);
    const [profileAfterFirst] = await readProfiles(user);
    const second = await sendEvent(event, delivery);

    expect(first).toEqual({ status: 200, body: { status: "synced" } });
    expect(second).toEqual({
      status: 200,
      body: { status: "ignored_outdated" },
    });
    expect(await readProfiles(user)).toEqual([profileAfterFirst]);
  });

  it("updates name and photo on user.updated and keeps the preferences", async () => {
    const user = createUser();
    const profile = await createProfile(user, {
      locale: "en",
      theme: "dark",
      clerk_updated_at: new Date(
        Date.now() - MINUTE_MILLISECONDS,
      ).toISOString(),
    });

    const result = await sendEvent(
      buildClerkUserEvent("user.updated", user, {
        firstName: "New",
        lastName: "Name",
        imageUrl: "https://img.clerk.com/new-photo",
      }),
    );

    expect(result.body).toEqual({ status: "synced" });
    expect(await readProfiles(user)).toEqual([
      expect.objectContaining({
        display_name: "New Name",
        avatar_url: "https://img.clerk.com/new-photo",
        locale: "en",
        theme: "dark",
        invite_code: profile.invite_code,
      }),
    ]);
  });

  it("removes the photo when the user deletes it in Google/Clerk", async () => {
    const user = createUser();
    await createProfile(user, {
      avatar_url: "https://img.clerk.com/old-photo",
      clerk_updated_at: new Date(
        Date.now() - MINUTE_MILLISECONDS,
      ).toISOString(),
    });

    await sendEvent(
      buildClerkUserEvent("user.updated", user, { imageUrl: null }),
    );

    expect((await readProfiles(user))[0]?.avatar_url).toBeNull();
  });

  it("ignores an older user.updated that arrives after a newer one", async () => {
    const user = createUser();
    const now = Date.now();
    await sendEvent(
      buildClerkUserEvent("user.updated", user, {
        firstName: "Newer",
        updatedAt: now,
      }),
    );

    const late = await sendEvent(
      buildClerkUserEvent("user.updated", user, {
        firstName: "Older",
        updatedAt: now - MINUTE_MILLISECONDS,
      }),
    );

    expect(late.body).toEqual({ status: "ignored_outdated" });
    expect((await readProfiles(user))[0]?.display_name).toBe("Newer");
  });

  it("creates the profile from user.updated when user.created is late", async () => {
    const user = createUser();
    const now = Date.now();

    await sendEvent(
      buildClerkUserEvent("user.updated", user, {
        firstName: "Updated",
        updatedAt: now,
      }),
    );
    const late = await sendEvent(
      buildClerkUserEvent("user.created", user, {
        firstName: "Created",
        updatedAt: now - MINUTE_MILLISECONDS,
      }),
    );

    expect(late.body).toEqual({ status: "ignored_outdated" });
    expect(await readProfiles(user)).toEqual([
      expect.objectContaining({ display_name: "Updated" }),
    ]);
  });

  it("deletes the profile on user.deleted, also when replayed", async () => {
    const user = createUser();
    await createProfile(user);
    const event = buildClerkUserEvent("user.deleted", user);

    const first = await sendEvent(event);
    const second = await sendEvent(event);

    expect(first).toEqual({ status: 200, body: { status: "deleted" } });
    expect(second).toEqual({ status: 200, body: { status: "deleted" } });
    expect(await readProfiles(user)).toEqual([]);
  });

  it("doesn't bring a deleted user back with a late user.updated", async () => {
    const user = createUser();
    await createProfile(user);
    await sendEvent(buildClerkUserEvent("user.deleted", user));

    const late = await sendEvent(buildClerkUserEvent("user.updated", user));

    expect(late.body).toEqual({ status: "ignored_deleted" });
    expect(await readProfiles(user)).toEqual([]);
  });
});
