"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { FOCUS_RING_CLASS_NAME } from "@/components/ui/focus-ring";
import { cn } from "@/lib/utils/cn";

import { getAppPath, isNavItemActive, NAV_ITEMS } from "./nav-items";

import type { NavLinks } from "./nav-items.types";

/**
 * Mobile navigation (< 1024 px): fixed to the bottom, four equal columns with
 * a 24 px icon over the label, padded by the iPhone home-indicator inset.
 * The active section is `text-primary` semibold with `aria-current="page"`.
 * No count badges (docs/ui-mockups.md, decision 5).
 */
export function BottomNav() {
  const { label, links } = useNavLinks();

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 h-(--bottom-nav-inset) border-t border-border bg-background pt-1.5 pr-[max(0.5rem,env(safe-area-inset-right,0px))] pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] lg:hidden"
    >
      <ul className="grid h-full grid-cols-4">
        {links.map(({ item, href, text, isActive }) => (
          <li key={item.section} className="flex">
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md text-xs",
                FOCUS_RING_CLASS_NAME,
                isActive
                  ? "font-semibold text-primary"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon aria-hidden="true" size={24} strokeWidth={1.5} />
              <span className="max-w-full truncate">{text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Desktop navigation (≥ 1024 px): text-only items in the left sidebar, the
 * active one on `bg-primary-soft` in semibold with `aria-current="page"`.
 */
export function SidebarNav() {
  const { label, links } = useNavLinks();

  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-0.5">
        {links.map(({ item, href, text, isActive }) => (
          <li key={item.section}>
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-sm px-3 text-sm text-foreground",
                FOCUS_RING_CLASS_NAME,
                isActive ? "bg-primary-soft font-semibold" : "hover:bg-accent",
              )}
            >
              {text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const useNavLinks = (): NavLinks => {
  const pathname = usePathname();
  const locale = useLocale();
  const translate = useTranslations("nav");

  return useMemo(
    () => ({
      label: translate("mainLabel"),
      links: NAV_ITEMS.map((item) => {
        const href = getAppPath(locale, item.segment);
        return {
          item,
          href,
          text: translate(item.section),
          isActive: isNavItemActive(pathname, href),
        };
      }),
    }),
    [locale, pathname, translate],
  );
};
