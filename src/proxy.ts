import createMiddleware from "next-intl/middleware";

import { routing } from "@/lib/i18n/routing";

import type { NextRequest } from "next/server";

/**
 * The app's one Proxy (Next.js 16 renamed `middleware.ts` to `proxy.ts`).
 * For now it only does next-intl's locale routing (E03-T01):
 *
 * - `/lt/…` and `/en/…` pass through; the URL's locale wins and refreshes
 *   the `NEXT_LOCALE` cookie when it differs.
 * - Any other path is redirected (307) to the same path with a locale:
 *   `NEXT_LOCALE` cookie → `Accept-Language` → `lt`. So `/` → `/lt`,
 *   `/sessions?tab=x` → `/en/sessions?tab=x`, and an unknown first segment
 *   (`/de/dashboard` → `/lt/de/dashboard`) ends on the localized 404.
 */
export function proxy(request: NextRequest) {
  // TODO(E04-T04): "saved profile locale" goes between the cookie and
  // Accept-Language. Switching language already writes NEXT_LOCALE (E03-T02,
  // in the browser); once E04-T04 also saves `profiles.locale` and sets the
  // cookie from it on sign-in, only a signed-in user without the cookie (new
  // device) needs a lookup.
  return handleLocaleRouting(request);
}

// TODO(E04-T01): wrap with Clerk instead of exporting `proxy` above, keeping
// one Proxy: `export const proxy = clerkMiddleware(async (auth, request) =>
// { if (isProtectedRoute(request)) await auth.protect(); return
// handleLocaleRouting(request); })`, and add Clerk's `/(api|trpc)(.*)`
// matcher entry (API routes need auth but no locale: skip
// handleLocaleRouting for them).
const handleLocaleRouting = createMiddleware(routing);

export const config = {
  // Every page path except API routes, Next.js internals, the unlocalized
  // developer pages and files (anything with a dot). Must be a literal so
  // Next.js can read it at build time. Matches "/", "/lt/sessions/123",
  // "/sessions"; skips "/api/health", "/_next/static/…", "/dev/ui",
  // "/debug/error", "/favicon.ico".
  matcher: [
    "/((?!api(?:/|$)|_next/|_vercel/|dev(?:/|$)|debug(?:/|$)|.*\\..*).*)",
  ],
};
