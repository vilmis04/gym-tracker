import enMessages from "../../../messages/en.json";
import ltMessages from "../../../messages/lt.json";

import type {
  GetTranslationsOptions,
  Locale,
  MessageKey,
  MessageNamespace,
  Messages,
  Translator,
} from "./i18n.types";

// TODO(E03): replace this module with next-intl. The JSON files and the
// `getTranslations({ locale, namespace })` / `useTranslations(namespace)`
// call shapes already follow next-intl, so call sites only change imports.

/** Every locale's messages; typed against EN, so a key missing in LT fails typecheck. */
export const MESSAGES: Record<Locale, Messages> = {
  en: enMessages,
  lt: ltMessages,
};

/** Server Components: `const t = await getTranslations({ locale, namespace: "nav" })`. */
export async function getTranslations<Namespace extends MessageNamespace>(
  options: GetTranslationsOptions<Namespace>,
): Promise<Translator<Namespace>> {
  return createTranslator(options);
}

/** The synchronous lookup behind `getTranslations` and `useTranslations`. */
export function createTranslator<Namespace extends MessageNamespace>({
  locale,
  namespace,
}: GetTranslationsOptions<Namespace>): Translator<Namespace> {
  const namespaceMessages: Record<MessageKey<Namespace>, string> = MESSAGES[
    locale
  ][namespace];
  return (key) => namespaceMessages[key];
}
