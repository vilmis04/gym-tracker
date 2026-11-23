import { describe, expect, it, vi } from "vitest";

import { createUser } from "@tests/factories";
import {
  buildClerkUserEvent,
  TEST_CLERK_WEBHOOK_SIGNING_SECRET,
} from "@tests/helpers/clerk-webhook";

import {
  clerkUserEventSchema,
  getClerkProfileSourceFromJSON,
  getClerkWebhookSigningSecret,
} from "./clerk-webhook";

describe("getClerkWebhookSigningSecret", () => {
  it("returns a whsec_ secret", () => {
    vi.stubEnv(
      "CLERK_WEBHOOK_SIGNING_SECRET",
      TEST_CLERK_WEBHOOK_SIGNING_SECRET,
    );

    expect(getClerkWebhookSigningSecret()).toBe(
      TEST_CLERK_WEBHOOK_SIGNING_SECRET,
    );
  });

  it.each(["", "not-a-secret", "whsec_"])(
    "throws naming the variable for %j",
    (value) => {
      vi.stubEnv("CLERK_WEBHOOK_SIGNING_SECRET", value);

      expect(() => getClerkWebhookSigningSecret()).toThrow(
        /CLERK_WEBHOOK_SIGNING_SECRET/,
      );
    },
  );
});

describe("clerkUserEventSchema", () => {
  const user = createUser();

  it.each(["user.created", "user.updated", "user.deleted"] as const)(
    "accepts a %s event",
    (type) => {
      expect(
        clerkUserEventSchema.safeParse(buildClerkUserEvent(type, user)).success,
      ).toBe(true);
    },
  );

  it("rejects other event types", () => {
    expect(
      clerkUserEventSchema.safeParse({
        type: "session.created",
        data: { id: "sess_1" },
      }).success,
    ).toBe(false);
  });

  it("rejects a user payload without the fields the sync reads", () => {
    expect(
      clerkUserEventSchema.safeParse({
        type: "user.updated",
        data: { id: user.id },
      }).success,
    ).toBe(false);
  });
});

describe("getClerkProfileSourceFromJSON", () => {
  it("reads the primary email address and the photo", () => {
    const user = createUser({ displayName: "Rūta" });
    const event = clerkUserEventSchema.parse(
      buildClerkUserEvent("user.updated", user, {
        updatedAt: 1_700_000_000_000,
        lastName: "Žemaitė",
        imageUrl: "https://img.clerk.com/ruta",
      }),
    );
    if (event.type === "user.deleted") throw new Error("Expected a user event");

    expect(
      getClerkProfileSourceFromJSON({
        ...event.data,
        email_addresses: [
          { id: "idn_other", email_address: "other@example.com" },
          ...event.data.email_addresses,
        ],
      }),
    ).toEqual({
      id: user.id,
      firstName: "Rūta",
      lastName: "Žemaitė",
      username: null,
      email: user.email,
      hasImage: true,
      imageUrl: "https://img.clerk.com/ruta",
      updatedAt: 1_700_000_000_000,
    });
  });

  it("has no email when the primary address is missing", () => {
    const event = clerkUserEventSchema.parse(
      buildClerkUserEvent("user.created", createUser()),
    );
    if (event.type === "user.deleted") throw new Error("Expected a user event");

    expect(
      getClerkProfileSourceFromJSON({
        ...event.data,
        primary_email_address_id: null,
      }).email,
    ).toBeNull();
  });
});
