import { createHmac, randomUUID } from "node:crypto";

import { NextRequest } from "next/server";

import type { TestUser } from "../factories";
import type {
  ClerkUserEventOptions,
  SignedClerkWebhookOptions,
} from "./clerk-webhook.types";

/**
 * A made-up Svix signing secret for tests ("whsec_" + the base64 of
 * "gym-tracker-test-webhook-secret");
 * stub `CLERK_WEBHOOK_SIGNING_SECRET` with it.
 */
export const TEST_CLERK_WEBHOOK_SIGNING_SECRET =
  "whsec_Z3ltLXRyYWNrZXItdGVzdC13ZWJob29rLXNlY3JldA==";

/**
 * Builds the JSON body Clerk sends for a `user.*` event about `user` (only
 * the fields the app reads, plus `object`). `updatedAt` is Clerk's
 * `updated_at` in epoch milliseconds.
 */
export function buildClerkUserEvent(
  type: "user.created" | "user.updated" | "user.deleted",
  user: TestUser,
  {
    updatedAt = Date.now(),
    firstName = user.displayName,
    lastName = null,
    imageUrl = null,
    email = user.email,
  }: ClerkUserEventOptions = {},
): Record<string, unknown> {
  if (type === "user.deleted") {
    return {
      type,
      object: "event",
      data: { id: user.id, object: "user", deleted: true },
    };
  }
  const emailAddressId = `idn_${user.id}`;
  return {
    type,
    object: "event",
    timestamp: updatedAt,
    data: {
      id: user.id,
      object: "user",
      first_name: firstName,
      last_name: lastName,
      username: null,
      has_image: imageUrl !== null,
      image_url: imageUrl ?? "https://img.clerk.com/placeholder",
      primary_email_address_id: email === null ? null : emailAddressId,
      email_addresses:
        email === null
          ? []
          : [
              {
                id: emailAddressId,
                object: "email_address",
                email_address: email,
              },
            ],
      created_at: updatedAt,
      updated_at: updatedAt,
    },
  };
}

/**
 * A `POST /api/webhooks/clerk` request signed the way Clerk (Svix) signs
 * it: `svix-signature` = `v1,` + base64 HMAC-SHA256 of
 * `{svix-id}.{svix-timestamp}.{body}` with the secret's decoded key. Pass
 * another secret or an old timestamp to get a request the route must reject.
 */
export function createSignedClerkWebhookRequest(
  payload: unknown,
  {
    secret = TEST_CLERK_WEBHOOK_SIGNING_SECRET,
    messageId = `msg_${randomUUID()}`,
    timestamp = new Date(),
  }: SignedClerkWebhookOptions = {},
): NextRequest {
  const body = JSON.stringify(payload);
  const timestampSeconds = Math.floor(timestamp.getTime() / 1000).toString();
  const key = Buffer.from(secret.slice(SIGNING_SECRET_PREFIX.length), "base64");
  const signature = createHmac("sha256", key)
    .update(`${messageId}.${timestampSeconds}.${body}`)
    .digest("base64");
  return createClerkWebhookRequest(body, {
    "svix-id": messageId,
    "svix-timestamp": timestampSeconds,
    "svix-signature": `v1,${signature}`,
  });
}

/** An unsigned (or hand-signed) webhook request with the given headers. */
export function createClerkWebhookRequest(
  body: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest("http://localhost:3000/api/webhooks/clerk", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

// Clerk shows Svix secrets as "whsec_" + the base64 key.
const SIGNING_SECRET_PREFIX = "whsec_";
