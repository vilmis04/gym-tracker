import { CalendarDays, ChartLine, House, Users } from "lucide-react";

import type { Locale } from "@/lib/i18n/i18n.types";

import type { NavItem } from "./nav-items.types";

/**
 * Home, Sessions, Progress, Buddies, in this order on every screen size.
 * Home is the `dashboard` route (docs/architecture.md → Code structure).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { section: "home", segment: "dashboard", icon: House },
  { section: "sessions", segment: "sessions", icon: CalendarDays },
  { section: "progress", segment: "progress", icon: ChartLine },
  { section: "buddies", segment: "buddies", icon: Users },
];

export function getAppPath(locale: Locale, segment: string): string {
  return `/${locale}/${segment}`;
}

/**
 * A section stays active on its detail pages: `/lt/sessions` is active for
 * `/lt/sessions/123`, but not for `/lt/sessions-archive`.
 */
export function isNavItemActive(pathname: string, itemHref: string): boolean {
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}
