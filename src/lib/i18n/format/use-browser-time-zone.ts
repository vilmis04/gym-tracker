import { useSyncExternalStore } from "react";

/**
 * The browser's time zone, or `null` on the server and during hydration.
 * So the first client render matches the server HTML (rendered in the
 * request config's zone), and React renders again with the browser's zone
 * right after hydrating, without a hydration mismatch.
 */
export function useBrowserTimeZone(): string | null {
  return useSyncExternalStore(
    subscribeToNothing,
    getBrowserTimeZone,
    getNoTimeZone,
  );
}

/** The browser's IANA time zone, e.g. "Europe/Vilnius". Browser only. */
export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// The zone only changes when the device's clock settings do; picking that
// up on the next render is enough.
const subscribeToNothing = () => () => {};

const getNoTimeZone = () => null;
