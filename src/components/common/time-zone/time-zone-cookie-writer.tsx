"use client";

import { useEffect } from "react";

import { getBrowserTimeZone } from "@/lib/i18n/format/use-browser-time-zone";
import {
  TIME_ZONE_COOKIE_MAX_AGE_SECONDS,
  TIME_ZONE_COOKIE_NAME,
} from "@/lib/i18n/time-zone";

/**
 * Tells the server the browser's time zone (E03-T03): after hydration,
 * writes it to the time zone cookie when the cookie is missing or holds
 * another zone (the user travelled or changed the clock settings). Server
 * code reads it with `getFormat()` / `getRequestTimeZone()`. Renders
 * nothing; once in the root document.
 */
export function TimeZoneCookieWriter() {
  useEffect(() => {
    const browserTimeZone = getBrowserTimeZone();
    if (readTimeZoneCookie() === browserTimeZone) return;

    document.cookie = [
      `${TIME_ZONE_COOKIE_NAME}=${encodeURIComponent(browserTimeZone)}`,
      "path=/",
      `max-age=${TIME_ZONE_COOKIE_MAX_AGE_SECONDS}`,
      "SameSite=Lax",
    ].join("; ");
  }, []);

  return null;
}

const readTimeZoneCookie = () => {
  const cookiePrefix = `${TIME_ZONE_COOKIE_NAME}=`;
  const cookieEntry = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(cookiePrefix));
  return cookieEntry === undefined
    ? undefined
    : decodeURIComponent(cookieEntry.slice(cookiePrefix.length));
};
