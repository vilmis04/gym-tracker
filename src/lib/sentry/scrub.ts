import { type Breadcrumb, type Event } from "@sentry/nextjs";

/**
 * PII scrubbing for error-tracking events (E01-T07): events must never carry
 * email addresses, auth tokens, cookies or other credentials. Runs in
 * `beforeSend` / `beforeBreadcrumb` on every runtime (browser, Node, edge),
 * on top of the minimal `dataCollection` in `./options.ts`.
 */

export const FILTERED = "[Filtered]";
export const EMAIL_PLACEHOLDER = "[email]";
export const JWT_PLACEHOLDER = "[jwt]";

const EMAIL =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
// header.payload.signature, base64url, header starting with `{"` → `eyJ`.
const JWT = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*/g;
const AUTH_SCHEME = /\b(Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]+/gi;
// Clerk (sk_live_…), Stripe-style and Supabase (sb_secret_…) secret keys.
const SECRET_KEY =
  /\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+|\bsb_secret_[A-Za-z0-9_-]+/g;
// `?token=…`, `&api_key=…`, `&code=…` (OAuth) in URLs and query strings.
const SECRET_PARAM =
  /([?&](?:[^=&#\s]*(?:token|secret|password|api[-_]?key|signature)[^=&#\s]*|code|__clerk_[^=&#\s]*))=[^&#\s]*/gi;

/** Object keys whose values are always dropped, whatever they contain. */
const SECRET_KEY_NAME =
  /^(?:authorization|proxy-authorization|cookies?|set-cookie|x-api-key|apikey|__session|__client(?:_uat)?)$|pass(?:word|wd)|secret|token|api[-_]?key|credential|private[-_]?key/i;

export function scrubString(value: string): string {
  return value
    .replace(JWT, JWT_PLACEHOLDER)
    .replace(AUTH_SCHEME, `$1 ${FILTERED}`)
    .replace(SECRET_KEY, FILTERED)
    .replace(SECRET_PARAM, `$1=${FILTERED}`)
    .replace(EMAIL, EMAIL_PLACEHOLDER);
}

/** Deep copy of `value` with every string scrubbed and secret keys dropped. */
export function scrubValue<T>(value: T, seen = new WeakSet<object>()): T {
  if (typeof value === "string") return scrubString(value) as T;
  if (typeof value !== "object" || value === null) return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item: unknown) => scrubValue(item, seen)) as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    // Cookie *names* can carry tokens too (`sb-<ref>-auth-token`).
    const scrubbedKey = scrubString(key);
    result[scrubbedKey] = SECRET_KEY_NAME.test(key)
      ? FILTERED
      : scrubValue(item, seen);
  }
  return result as T;
}

/**
 * `beforeSend`: scrubs the whole event (message,
 * exception values, request, breadcrumbs, contexts, extra, tags) and keeps
 * only the user's id (no email, username or IP address).
 */
export function scrubEvent<E extends Event>(event: E): E {
  const scrubbed = scrubValue(event);
  if (scrubbed.user) {
    scrubbed.user =
      scrubbed.user.id === undefined ? {} : { id: scrubbed.user.id };
  }
  if (scrubbed.request) {
    delete scrubbed.request.cookies;
  }
  return scrubbed;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  return scrubValue(breadcrumb);
}
