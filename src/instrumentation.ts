import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentry/options";

/**
 * Next.js instrumentation hook: runs once when a server instance starts, in
 * the Node.js and in the edge runtime (E01-T07). Error tracking is enabled
 * only when a DSN is configured: `SENTRY_DSN` (runtime) or, as a fallback,
 * the build-time `NEXT_PUBLIC_SENTRY_DSN`.
 */
export function register(): void {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init(sentryOptions(dsn));
}

/** Reports errors thrown while rendering Server Components, route handlers, Server Actions and middleware. */
export const onRequestError = Sentry.captureRequestError;
