import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import { AuthProvider } from "@/components/common/auth/auth-provider";
import { LOCALES } from "@/lib/i18n/locales";

import { ROOT_VIEWPORT, RootDocument } from "../root-document";

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = ROOT_VIEWPORT;

// Both languages are prerendered; the proxy sends every other first segment
// to a localized URL, so an unknown one is only reachable without it.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const translate = await getTranslations("common");
  const appName = translate("appName");
  return {
    title: { template: `%s · ${appName}`, default: appName },
    description: translate("metaDescription"),
  };
}

/**
 * Root layout of every localized page (E03-T01): `<html lang>` is the URL's
 * locale, and client components get the messages through
 * `NextIntlClientProvider` (locale and messages come from
 * `src/lib/i18n/request.ts`). `AuthProvider` (Clerk, E04-T01) takes the same
 * locale, so `<SignIn />` and the avatar menu follow the language switch.
 */
export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(LOCALES, locale)) notFound();

  return (
    <RootDocument lang={locale}>
      <AuthProvider locale={locale}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </AuthProvider>
    </RootDocument>
  );
}
