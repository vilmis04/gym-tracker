import * as Sentry from "@sentry/nextjs";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";

import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

/**
 * Makes sure the signed-in user has a `profiles` row (E04-T03 first-request
 * fallback for a late `user.created` webhook). Renders nothing; streamed in
 * its own `<Suspense>` by the `(app)` layout so the page doesn't wait for it.
 *
 * `connection()` keeps it out of prerendering, so the signed-in pages are
 * rendered per request with or without Clerk keys at build time (a
 * prerendered page would never run it).
 *
 * A failure is reported, not thrown: the sync is retried on the next
 * request, while an error here would replace the whole signed-in area.
 * Pages that need the profile call `getCurrentProfile()` themselves (the same
 * request-cached promise) and handle its errors in their `error.tsx`.
 */
export async function EnsureProfile() {
  await connection();
  try {
    await getCurrentProfile();
  } catch (error) {
    // Next.js signals (dynamic rendering, redirects) must reach Next.js.
    unstable_rethrow(error);
    Sentry.captureException(error);
  }
  return null;
}
