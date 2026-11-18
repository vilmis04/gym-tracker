import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentry/options";

// Browser error tracking (E01-T07): runs before the app hydrates. Only enabled
// when NEXT_PUBLIC_SENTRY_DSN was set at build time (it's inlined).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init(sentryOptions(dsn));
}

// Navigation instrumentation hook (a no-op while tracing is off).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
