import { z } from "zod";

import type { ClerkProfileSource, ClerkUserJSON } from "./profiles.types";

/**
 * The webhook signing secret from `CLERK_WEBHOOK_SIGNING_SECRET` (Clerk
 * dashboard → Webhooks → the endpoint's "Signing Secret").
 *
 * @throws {Error} When it is unset or not a `whsec_…` secret: without it no
 *   event can be verified, so the route fails loudly instead of answering 401
 *   to every genuine event.
 */
export function getClerkWebhookSigningSecret(): string {
  const parsedSecret = signingSecretSchema.safeParse(
    process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  );
  if (!parsedSecret.success) {
    throw new Error(
      "CLERK_WEBHOOK_SIGNING_SECRET is missing or not a whsec_ secret (docs/deployment.md → Clerk webhook).",
    );
  }
  return parsedSecret.data;
}

/**
 * The parts of a verified Clerk event the profile sync reads. Other event
 * types and payloads without these fields fail to parse and are ignored.
 */
export const clerkUserEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["user.created", "user.updated"]),
    data: z.object({
      id: z.string().min(1),
      first_name: z.string().nullish(),
      last_name: z.string().nullish(),
      username: z.string().nullish(),
      image_url: z.string(),
      has_image: z.boolean(),
      primary_email_address_id: z.string().nullish(),
      email_addresses: z.array(
        z.object({ id: z.string(), email_address: z.string() }),
      ),
      updated_at: z.number(),
    }),
  }),
  z.object({
    type: z.literal("user.deleted"),
    data: z.object({ id: z.string().min(1) }),
  }),
]);

/** Reads the profile fields from a `user.created` / `user.updated` payload. */
export function getClerkProfileSourceFromJSON({
  id,
  first_name: firstName,
  last_name: lastName,
  username,
  image_url: imageUrl,
  has_image: hasImage,
  primary_email_address_id: primaryEmailAddressId,
  email_addresses: emailAddresses,
  updated_at: updatedAt,
}: ClerkUserJSON): ClerkProfileSource {
  const primaryEmailAddress = emailAddresses.find(
    (emailAddress) => emailAddress.id === primaryEmailAddressId,
  );
  return {
    id,
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    username: username ?? null,
    email: primaryEmailAddress?.email_address ?? null,
    hasImage,
    imageUrl,
    updatedAt,
  };
}

// Svix signing secrets: "whsec_" and base64, e.g. "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw".
const CLERK_WEBHOOK_SIGNING_SECRET_REGEX = /^whsec_[A-Za-z0-9+/=]+$/;

const signingSecretSchema = z
  .string()
  .regex(CLERK_WEBHOOK_SIGNING_SECRET_REGEX);
