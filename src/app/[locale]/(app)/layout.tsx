import { AppShell } from "@/components/common/app-shell/app-shell";
import { getLocaleParam } from "@/lib/i18n/locale-param";
import { LOCALES } from "@/lib/i18n/locales";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s · Gym Tracker", default: "Gym Tracker" },
};

// Both languages are prerendered; any other first segment answers 404.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Layout of the signed-in area (`/[locale]/dashboard`, `/sessions`, …):
 * the app shell with the bottom navigation / sidebar (E02-T06).
 */
export default async function AppLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = await getLocaleParam(params);
  // TODO(E04-T01): the auth gate goes here. Clerk's middleware protects every
  // (app) route; until then these placeholder pages are public.

  return <AppShell locale={locale}>{children}</AppShell>;
}
