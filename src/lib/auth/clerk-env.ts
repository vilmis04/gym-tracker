import { z } from "zod";

/**
 * Whether the Clerk publishable key is set, i.e. sign-in can work. Without it
 * the app still builds and serves its public pages and `/api/health` (CI's
 * build, Docker and e2e jobs run without Clerk keys), but nothing behind
 * sign-in is reachable: `src/proxy.ts` sends protected pages to the sign-in
 * page, which then says sign-in isn't available.
 *
 * `process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must stay literal: Next.js
 * inlines it at build time, so server and browser always agree.
 */
export function isClerkConfigured(): boolean {
  return publishableKeySchema.safeParse(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  ).success;
}

// "pk_test_" (development instance) or "pk_live_" (production instance) and
// the base64 Frontend API host, e.g. "pk_test_Z3ltLXRyYWNrZXIuY2xlcmsuYWNjb3VudHMuZGV2JA".
const CLERK_PUBLISHABLE_KEY_REGEX = /^pk_(?:test|live)_[A-Za-z0-9+/=]+$/;

const publishableKeySchema = z.string().regex(CLERK_PUBLISHABLE_KEY_REGEX);
