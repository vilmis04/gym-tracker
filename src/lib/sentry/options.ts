import { scrubBreadcrumb, scrubEvent } from "./scrub";

import type * as Sentry from "@sentry/nextjs";

type SentryOptions = NonNullable<Parameters<typeof Sentry.init>[0]>;

/**
 * Options shared by every runtime's `Sentry.init()` (E01-T07):
 * `src/instrumentation-client.ts` (browser) and `src/instrumentation.ts`
 * (Node.js server and edge). Callers only init when a DSN is set, so builds,
 * CI and local dev run without Sentry.
 *
 * `release` is not set here: `withSentryConfig` (next.config.ts) injects the
 * same value into every bundle at build time (`APP_VERSION`, the commit SHA,
 * which `/api/health` also reports).
 */
export function sentryOptions(dsn: string): SentryOptions {
  const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT;
  return {
    dsn,
    // Collect as little as possible (the SDK's defaults collect everything):
    // no user info/IP, cookies, bodies, query strings, SQL values or local
    // variables; only a few harmless request headers. `beforeSend` scrubs
    // whatever remains (emails, tokens).
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: {
        request: {
          allow: ["accept-language", "content-type", "referer", "user-agent"],
        },
        response: false,
      },
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    // Errors only for now; performance tracing and session replay are off
    // (replay would record user data). Revisit with alerting (E10-T07).
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
    // Only when set: an explicit `undefined` would override the SDK default
    // (`SENTRY_ENVIRONMENT` / NODE_ENV).
    ...(environment && { environment }),
  };
}
