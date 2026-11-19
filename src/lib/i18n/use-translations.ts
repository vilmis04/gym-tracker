"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";

import { DEFAULT_LOCALE, localeSchema } from "./locales";
import { createTranslator } from "./messages";

import type { Locale, MessageNamespace, Translator } from "./i18n.types";

// TODO(E03): replace with next-intl's `useLocale` / `useTranslations`.

/**
 * The active locale in a client component, from the `[locale]` route segment.
 * Outside `/[locale]/…` (or with an unknown value, which the `(app)` layout
 * already answers with a 404) it is the default locale.
 */
export function useLocale(): Locale {
  const { locale } = useParams<{ locale?: string }>();
  return localeSchema.safeParse(locale).data ?? DEFAULT_LOCALE;
}

/** Client components: `const t = useTranslations("nav"); t("home")`. */
export function useTranslations<Namespace extends MessageNamespace>(
  namespace: Namespace,
): Translator<Namespace> {
  const locale = useLocale();
  return useMemo(
    () => createTranslator({ locale, namespace }),
    [locale, namespace],
  );
}
