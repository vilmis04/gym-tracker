export type ClerkUserEventOptions = {
  /** Clerk's `updated_at` (epoch ms); default now. */
  updatedAt?: number;
  /** Default: the test user's display name. */
  firstName?: string | null;
  lastName?: string | null;
  /** A photo URL; `null` (default) = no photo (`has_image: false`). */
  imageUrl?: string | null;
  /** The primary email address; default the test user's, `null` = none. */
  email?: string | null;
};

export type SignedClerkWebhookOptions = {
  /** Default: `TEST_CLERK_WEBHOOK_SIGNING_SECRET`. */
  secret?: string;
  /** The `svix-id` header; Clerk sends the same one on every retry. */
  messageId?: string;
  /** The `svix-timestamp`; Svix rejects ones more than 5 minutes off. */
  timestamp?: Date;
};
