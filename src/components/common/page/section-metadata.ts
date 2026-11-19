import { getTranslations } from "next-intl/server";

import type { MessageKey } from "@/lib/i18n/i18n.types";

import type { Metadata } from "next";

/**
 * `generateMetadata` of an app page: the translated section name as the
 * document title ("Treniruotės · Gym Tracker", template in the `[locale]`
 * root layout).
 */
export async function getSectionMetadata(
  titleKey: MessageKey<"nav">,
): Promise<Metadata> {
  const translate = await getTranslations("nav");
  return { title: translate(titleKey) };
}
