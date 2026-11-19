import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * next-intl's locale-aware navigation (E03-T02). `usePathname()` returns the
 * path without the locale ("/sessions"); `useRouter().replace(path, { locale
 * })` opens it in another locale and writes the `NEXT_LOCALE` cookie in the
 * browser, which a soft navigation needs: the proxy only writes the cookie
 * on document requests.
 */
export const { usePathname, useRouter } = createNavigation(routing);
