import { type LucideIcon } from "lucide-react";

/** The four main areas of the app (bottom navigation and sidebar). */
export type NavSection = "home" | "sessions" | "progress" | "buddies";

export interface NavItem {
  section: NavSection;
  /** First path segment after the locale, e.g. `sessions` → `/lt/sessions`. */
  segment: string;
  /** Bottom navigation only; the sidebar is text only. */
  icon: LucideIcon;
}

export interface NavLink {
  item: NavItem;
  href: string;
  /** The translated label. */
  text: string;
  isActive: boolean;
}

export interface NavLinks {
  /** Accessible name of the `<nav>` landmark. */
  label: string;
  links: NavLink[];
}
