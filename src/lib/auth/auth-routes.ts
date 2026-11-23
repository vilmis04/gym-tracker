import type { Locale } from "@/lib/i18n/i18n.types";
import { localeSchema } from "@/lib/i18n/locales";

/**
 * Which requests need a signed-in user (E04-T01), decided in the proxy
 * (`src/proxy.ts`):
 *
 * - Pages of the signed-in area, `/{locale}/{section}/…` for every folder of
 *   `src/app/[locale]/(app)/` ("/lt/sessions", "/en/progress/session/1").
 *   `auth-routes.test.ts` fails when a new folder is missing here.
 * - Every API route except the health check and the webhooks
 *   (`/api/webhooks/*` verify their own signatures, E04-T03).
 *
 * Public: the landing page (`/lt`), sign-in (`/lt/sign-in/…`), the localized
 * 404 page and URLs without a locale (the proxy first redirects those to a
 * localized URL, which is then checked).
 */
export function isProtectedPath(pathname: string): boolean {
  const segments = decodePathSegments(pathname);
  if (segments === null) return true;
  const [firstSegment, secondSegment, thirdSegment] = segments;

  if (firstSegment === API_SEGMENT) {
    if (secondSegment === "health" && thirdSegment === undefined) return false;
    return secondSegment !== "webhooks";
  }
  return (
    localeSchema.safeParse(firstSegment).success &&
    secondSegment !== undefined &&
    PROTECTED_APP_SEGMENTS.has(secondSegment)
  );
}

export function isApiPath(pathname: string): boolean {
  return pathname === `/${API_SEGMENT}` || pathname.startsWith("/api/");
}

/** The locale of a localized path ("/en/sessions" → "en"); undefined for "/sessions". */
export function getPathLocale(pathname: string): Locale | undefined {
  const parsedLocale = localeSchema.safeParse(pathname.split("/")[1]);
  return parsedLocale.success ? parsedLocale.data : undefined;
}

/** Clerk's `<SignIn />` lives here; it also handles the steps below it (`/sso-callback`). */
export function getSignInPath(locale: Locale): string {
  return `/${locale}/sign-in`;
}

/**
 * Where Google sends the browser back to during a sign-in started outside
 * `<SignIn />` (the landing page's "Continue with Google", E04-T05). The
 * sign-in page's catch-all route renders Clerk's callback step there, which
 * finishes the sign-in (or the sign-up of a new user).
 */
export function getSsoCallbackPath(locale: Locale): string {
  return `${getSignInPath(locale)}/sso-callback`;
}

/**
 * Whether the path is a landing page ("/lt", "/en/"), which the proxy shows
 * only to signed-out visitors (E04-T05).
 */
export function isLandingPath(pathname: string): boolean {
  const segments = decodePathSegments(pathname);
  return (
    segments !== null &&
    segments.length === 1 &&
    localeSchema.safeParse(segments[0]).success
  );
}

/**
 * Home, the first page of the signed-in area: where signing in ends unless
 * `redirect_url` says otherwise, and where signed-in users of the landing
 * page are sent.
 */
export function getHomePath(locale: Locale): string {
  return `/${locale}/dashboard`;
}

/** Where signing out ends: the public landing page. */
export function getLandingPath(locale: Locale): string {
  return `/${locale}`;
}

/**
 * The query parameter Clerk reads on the sign-in page to return to the
 * originally requested URL after signing in.
 */
export const REDIRECT_URL_SEARCH_PARAM = "redirect_url";

const API_SEGMENT = "api";

const PROTECTED_APP_SEGMENTS: ReadonlySet<string> = new Set([
  "dashboard",
  "sessions",
  "exercises",
  "progress",
  "buddies",
  "settings",
]);

/**
 * The path's segments, percent-decoded the way the router matches them
 * ("/lt/%73essions" is the sessions page), so an encoded path can't skip the
 * check. `null` for malformed encoding, which is then treated as protected.
 */
const decodePathSegments = (pathname: string): string[] | null => {
  try {
    return pathname
      .split("/")
      .filter((segment) => segment !== "")
      .map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }
};
