import type { MessageKey } from "@/lib/i18n/i18n.types";
import { getLocaleParam } from "@/lib/i18n/locale-param";
import { getTranslations } from "@/lib/i18n/messages";

import type { Metadata } from "next";

/**
 * `generateMetadata` of an app page: the translated section name as the
 * document title ("Treniruotės · Gym Tracker", template in the (app) layout).
 */
export async function getSectionMetadata(
  params: Promise<{ locale: string }>,
  titleKey: MessageKey<"nav">,
): Promise<Metadata> {
  const locale = await getLocaleParam(params);
  const translate = await getTranslations({ locale, namespace: "nav" });
  return { title: translate(titleKey) };
}
