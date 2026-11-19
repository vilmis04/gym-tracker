import enMessages from "../../../messages/en.json";
import ltMessages from "../../../messages/lt.json";

import type { Locale, Messages } from "./i18n.types";

/** Every locale's messages; typed against EN, so a key missing in LT fails typecheck. */
export const MESSAGES: Record<Locale, Messages> = {
  en: enMessages,
  lt: ltMessages,
};
