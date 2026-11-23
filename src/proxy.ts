import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import createMiddleware from "next-intl/middleware";

import {
  getPathLocale,
  getSignInPath,
  isApiPath,
  isProtectedPath,
  REDIRECT_URL_SEARCH_PARAM,
} from "@/lib/auth/auth-routes";
import { isClerkConfigured } from "@/lib/auth/clerk-env";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { routing } from "@/lib/i18n/routing";

/**
 * The app's one Proxy (Next.js 16 renamed `middleware.ts` to `proxy.ts`):
 * Clerk (E04-T01) around next-intl's locale routing (E03-T01).
 *
 * Auth (`isProtectedPath` in `src/lib/auth/auth-routes.ts`): a signed-out
 * request for a page of the signed-in area (`/lt/sessions`) is redirected to
 * `/lt/sign-in?redirect_url=<that URL>`, and Clerk's `<SignIn />` returns
 * there afterwards; a protected API route answers 404. The landing page,
 * sign-in, `/api/health` and `/api/webhooks/*` are public. Without Clerk
 * keys (`isClerkConfigured`) the same pages are refused the same way, so
 * nothing protected is ever served without sign-in.
 *
 * Locale (pages only; API routes have no locale):
 * - `/lt/…` and `/en/…` pass through; the URL's locale wins and refreshes
 *   the `NEXT_LOCALE` cookie when it differs.
 * - Any other path is redirected (307) to the same path with a locale:
 *   `NEXT_LOCALE` cookie → `Accept-Language` → `lt`. So `/` → `/lt`,
 *   `/sessions?tab=x` → `/en/sessions?tab=x` (then the auth check above),
 *   and an unknown first segment (`/de/dashboard` → `/lt/de/dashboard`)
 *   ends on the localized 404.
 * - The language saved in the profile (`profiles.locale`, E04-T04) is not
 *   read here (that would be a database lookup per request): right after
 *   sign-in `ApplySavedPreferences` opens the page in that language, which
 *   writes `NEXT_LOCALE`, so from then on the cookie step above carries it.
 */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured()) return handleWithoutClerk(request);
  return handleWithClerk(request, event);
}

export const config = {
  // Every page path except Next.js internals, the unlocalized developer
  // pages and files (anything with a dot), plus every API route (Clerk's
  // `auth()` works in route handlers only behind its middleware). Must be
  // literals so Next.js can read them at build time. Matches "/",
  // "/lt/sessions/123", "/sessions", "/api/health", "/api/webhooks/clerk";
  // skips "/_next/static/…", "/dev/ui", "/debug/error", "/favicon.ico".
  matcher: [
    "/((?!api(?:/|$)|_next/|_vercel/|dev(?:/|$)|debug(?:/|$)|.*\\..*).*)",
    "/api/:path*",
  ],
};

const handleLocaleRouting = createMiddleware(routing);

const routeRequest = (request: NextRequest) =>
  isApiPath(request.nextUrl.pathname)
    ? NextResponse.next()
    : handleLocaleRouting(request);

const handleWithClerk = clerkMiddleware(
  async (auth, request) => {
    // Redirects to `signInUrl` below (pages) or answers 404 (API routes).
    if (isProtectedPath(request.nextUrl.pathname)) await auth.protect();
    return routeRequest(request);
  },
  (request) => {
    const signInPath = getSignInPath(
      getPathLocale(request.nextUrl.pathname) ?? DEFAULT_LOCALE,
    );
    return { signInUrl: signInPath, signUpUrl: signInPath };
  },
);

/** Clerk's signed-out behaviour without Clerk: sign-in page or 404, never the page. */
const handleWithoutClerk = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) return routeRequest(request);
  if (isApiPath(pathname)) return new NextResponse(null, { status: 404 });

  const signInUrl = new URL(
    getSignInPath(getPathLocale(pathname) ?? DEFAULT_LOCALE),
    request.url,
  );
  signInUrl.searchParams.set(REDIRECT_URL_SEARCH_PARAM, request.url);
  return NextResponse.redirect(signInUrl);
};
