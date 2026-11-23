import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { type NextRequest } from "next/server";

import {
  clerkUserEventSchema,
  getClerkWebhookSigningSecret,
} from "@/lib/profiles/clerk-webhook";
import {
  ClerkEventOutcome,
  handleClerkUserEvent,
} from "@/lib/profiles/handle-clerk-user-event";

/**
 * Clerk webhook (E04-T03): keeps `profiles` in sync with Clerk's
 * `user.created`, `user.updated` and `user.deleted` events.
 *
 * Public in the proxy (`isProtectedPath`), so the Svix signature is the only
 * check: a missing, invalid or older-than-five-minutes signature gets 401 and
 * changes nothing. Writes with the service role. Every event can be replayed
 * safely (see `sync_profile_from_clerk()`); a database error answers 500 so
 * Clerk retries. Other event types are acknowledged and ignored.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const signingSecret = getClerkWebhookSigningSecret();
  const event = await verifyWebhook(request, { signingSecret }).catch(
    () => null,
  );
  if (!event) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  const parsedEvent = clerkUserEventSchema.safeParse(event);
  if (!parsedEvent.success) {
    // Only the type: payloads carry personal data.
    console.warn(`Clerk webhook: ignored ${event.type} event`);
    return Response.json({ status: ClerkEventOutcome.IGNORED_UNSUPPORTED });
  }
  return Response.json({
    status: await handleClerkUserEvent(parsedEvent.data),
  });
}
