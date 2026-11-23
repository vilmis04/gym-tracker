import type { FORMATS } from "@/lib/i18n/format/formats";
import type { Locale } from "@/lib/i18n/i18n.types";

import type enMessages from "../messages/en.json";

// next-intl's type-safe locale and message keys (E03-T01): `useLocale()`
// returns "lt" | "en", and `useTranslations("nav")("missing")` or
// `getTranslations("nope")` fail typecheck. EN is the reference file. The
// named formats too (E03-T03): `format.dateTime(value, "nope")` fails.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof enMessages;
    Formats: typeof FORMATS;
  }
}
