import { z } from "zod";

/**
 * The public origin of the app (E04-T05), e.g. `https://gymtracker.app`, from
 * `NEXT_PUBLIC_SITE_URL`. Metadata needs it for absolute URLs: the Open
 * Graph image, `og:url` and the canonical / language alternate links that
 * link previews and search engines read. `undefined` when unset (local, CI):
 * Next.js then falls back to `http://localhost:<port>` for the image and the
 * page leaves out the links that would point at the wrong host.
 *
 * `process.env.NEXT_PUBLIC_SITE_URL` must stay literal: Next.js inlines it at
 * build time, and the landing page's metadata is prerendered then too, so
 * changing it needs a rebuild (docs/deployment.md → Variables).
 *
 * @throws {Error} When the variable is set but isn't an http(s) URL, so a
 *   typo fails the build instead of shipping broken link previews.
 */
export function getSiteUrl(): URL | undefined {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) return undefined;

  const parsedSiteUrl = siteUrlSchema.safeParse(value);
  if (!parsedSiteUrl.success) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an http(s) URL such as https://gymtracker.app, got "${value}".`,
    );
  }
  return new URL(parsedSiteUrl.data);
}

// The URL scheme without "://", e.g. "https" or "http".
const HTTP_PROTOCOL_REGEX = /^https?$/;

const siteUrlSchema = z.url({ protocol: HTTP_PROTOCOL_REGEX });
