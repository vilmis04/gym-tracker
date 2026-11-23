import { z } from "zod";

/**
 * The time zone used when the user's isn't known: statically prerendered
 * pages, and the first request before the browser has written
 * {@link TIME_ZONE_COOKIE_NAME}. Most users train in Lithuania.
 */
export const DEFAULT_TIME_ZONE = "Europe/Vilnius";

/**
 * The browser's IANA time zone (E03-T03), written by `TimeZoneCookieWriter`
 * in the `[locale]` layout and read on the server by `getFormat()`, so
 * server-rendered times match the ones the browser renders.
 */
export const TIME_ZONE_COOKIE_NAME = "TIME_ZONE";

/** One year, like the locale cookie; rewritten whenever the zone changes. */
export const TIME_ZONE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Validates a time zone from untrusted input (the cookie): any zone or alias
 * `Intl.DateTimeFormat` accepts ("Europe/Vilnius", "America/New_York",
 * "UTC"). `Intl.supportedValuesOf("timeZone")` is not used because it leaves
 * out "UTC" and the aliases browsers report.
 */
export const timeZoneSchema = z
  .string()
  // The longest IANA names are about 30 characters; a cookie can be longer.
  .max(64)
  .refine((timeZone) => isSupportedTimeZone(timeZone));

const isSupportedTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
};
