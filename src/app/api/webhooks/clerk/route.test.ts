// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteProfileFromClerk,
  syncProfileFromClerk,
} from "@/lib/profiles/sync-profile";
import { createUser } from "@tests/factories";
import {
  buildClerkUserEvent,
  createClerkWebhookRequest,
  createSignedClerkWebhookRequest,
  TEST_CLERK_WEBHOOK_SIGNING_SECRET,
} from "@tests/helpers/clerk-webhook";

import { POST } from "./route";

// The database side is covered against local Supabase in
// tests/db/profiles/clerk-webhook.test.ts; here only the route's decisions.
vi.mock("@/lib/profiles/sync-profile", () => ({
  syncProfileFromClerk: vi.fn(async () => "synced"),
  deleteProfileFromClerk: vi.fn(async () => {}),
}));

const user = createUser({ displayName: "Rūta" });

beforeEach(() => {
  vi.stubEnv("CLERK_WEBHOOK_SIGNING_SECRET", TEST_CLERK_WEBHOOK_SIGNING_SECRET);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("POST /api/webhooks/clerk", () => {
  it("syncs the profile of a signed user.created event", async () => {
    const event = buildClerkUserEvent("user.created", user, {
      updatedAt: Date.UTC(2026, 10, 23, 12),
      lastName: "Žemaitė",
      imageUrl: "https://img.clerk.com/ruta",
    });

    const response = await POST(createSignedClerkWebhookRequest(event));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "synced" });
    expect(syncProfileFromClerk).toHaveBeenCalledWith({
      id: user.id,
      displayName: "Rūta Žemaitė",
      email: user.email.toLowerCase(),
      avatarUrl: "https://img.clerk.com/ruta",
      clerkUpdatedAt: new Date("2026-11-23T12:00:00.000Z"),
    });
  });

  it("deletes the profile on user.deleted", async () => {
    const response = await POST(
      createSignedClerkWebhookRequest(
        buildClerkUserEvent("user.deleted", user),
      ),
    );

    expect(await response.json()).toEqual({ status: "deleted" });
    expect(deleteProfileFromClerk).toHaveBeenCalledWith(user.id);
  });

  it("answers with what the sync did, e.g. for a replayed event", async () => {
    vi.mocked(syncProfileFromClerk).mockResolvedValueOnce("ignored_outdated");

    const response = await POST(
      createSignedClerkWebhookRequest(
        buildClerkUserEvent("user.updated", user),
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ignored_outdated" });
  });

  const tamperedRequest = () => {
    const signed = createSignedClerkWebhookRequest(
      buildClerkUserEvent("user.updated", user),
    );
    return createClerkWebhookRequest(
      JSON.stringify(
        buildClerkUserEvent("user.updated", createUser({ id: user.id }), {
          firstName: "Someone else",
        }),
      ),
      Object.fromEntries(signed.headers),
    );
  };

  it.each([
    ["no signature headers", () => createClerkWebhookRequest("{}")],
    [
      "a signature made with another secret",
      () =>
        createSignedClerkWebhookRequest(
          buildClerkUserEvent("user.created", user),
          {
            secret: "whsec_b3RoZXItc2VjcmV0LW90aGVyLXNlY3JldA==",
          },
        ),
    ],
    ["a body changed after signing", tamperedRequest],
    [
      "a signature older than five minutes (replay attack)",
      () =>
        createSignedClerkWebhookRequest(
          buildClerkUserEvent("user.created", user),
          {
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
          },
        ),
    ],
  ])("answers 401 and changes nothing for %s", async (_case, createRequest) => {
    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "invalid_signature" });
    expect(syncProfileFromClerk).not.toHaveBeenCalled();
    expect(deleteProfileFromClerk).not.toHaveBeenCalled();
  });

  it("acknowledges and ignores other event types", async () => {
    const response = await POST(
      createSignedClerkWebhookRequest({
        type: "session.created",
        object: "event",
        data: { id: "sess_1" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ignored_unsupported" });
    expect(console.warn).toHaveBeenCalledWith(
      "Clerk webhook: ignored session.created event",
    );
    expect(syncProfileFromClerk).not.toHaveBeenCalled();
  });

  it("ignores a user without an email address", async () => {
    const response = await POST(
      createSignedClerkWebhookRequest(
        buildClerkUserEvent("user.created", user, { email: null }),
      ),
    );

    expect(await response.json()).toEqual({ status: "ignored_no_email" });
    expect(syncProfileFromClerk).not.toHaveBeenCalled();
  });

  it("fails loudly without a signing secret", async () => {
    vi.stubEnv("CLERK_WEBHOOK_SIGNING_SECRET", "");

    await expect(
      POST(
        createSignedClerkWebhookRequest(
          buildClerkUserEvent("user.created", user),
        ),
      ),
    ).rejects.toThrow(/CLERK_WEBHOOK_SIGNING_SECRET/);
    expect(syncProfileFromClerk).not.toHaveBeenCalled();
  });

  it("fails (500, Clerk retries) when the database write fails", async () => {
    vi.mocked(syncProfileFromClerk).mockRejectedValueOnce(
      new Error("Could not sync the profile"),
    );

    await expect(
      POST(
        createSignedClerkWebhookRequest(
          buildClerkUserEvent("user.updated", user),
        ),
      ),
    ).rejects.toThrow("Could not sync the profile");
  });
});
