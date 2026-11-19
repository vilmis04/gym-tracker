import type { Locale } from "@/lib/i18n/i18n.types";

import type enMessages from "../messages/en.json";

// next-intl's type-safe locale and message keys (E03-T01): `useLocale()`
// returns "lt" | "en", and `useTranslations("nav")("missing")` or
// `getTranslations("nope")` fail typecheck. EN is the reference file.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof enMessages;
  }
}
