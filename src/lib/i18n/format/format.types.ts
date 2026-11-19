import type { Locale } from "../i18n.types";
import type { createTranslator, Messages } from "next-intl";

/**
 * The app's formatting presets (E03-T03), from `useFormat()` (client) or
 * `getFormat()` (server). Times are shown in the user's time zone. The
 * method names are the API the epic specifies (docs/epics/E03-i18n.md).
 */
export type FormatPresets = {
  /** Kilograms: "57,5 kg" (lt) / "57.5 kg" (en). */
  weight: (kilograms: number) => string;
  /** "2026 m. lapkričio 17 d." / "November 17, 2026". */
  date: (value: Date | number) => string;
  /** "2026 m. lapkričio 17 d. 07:30" / "November 17, 2026 at 07:30". */
  dateTime: (value: Date | number) => string;
  /** Relative to now, in the best-fitting unit: "prieš 2 dienas" / "2 days ago". */
  relative: (value: Date | number) => string;
  /** Rounded to whole minutes: "1 val. 15 min." / "1 h 15 min", "42 min". */
  duration: (minutes: number) => string;
};

export type FormatPresetsOptions = {
  locale: Locale;
  timeZone: string;
  /** The reference time of `relative()`. */
  now: Date;
  translate: FormatTranslator;
};

/** The `format` namespace's translator, from `useTranslations` or `getTranslations`. */
type FormatTranslator = ReturnType<typeof createTranslator<Messages, "format">>;
