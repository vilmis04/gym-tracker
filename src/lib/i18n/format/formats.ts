import type { Formats } from "next-intl";

/**
 * The app's named next-intl formats (E03-T03), shared by the server and the
 * client through the request config (`src/lib/i18n/request.ts`), so
 * `useFormatter().dateTime(value, "date")` and `useFormat().date(value)`
 * agree. Names are type-checked (`Formats` in `src/global.d.ts`).
 *
 * - `weight`: kilograms with up to 2 decimals, like `sets.weight_kg
 *   numeric(6,2)` and the NumberStepper weight preset ("57,5 kg" / "57.5 kg").
 * - `date`: "2026 m. lapkričio 17 d." / "November 17, 2026".
 * - `dateTime`: the date and a 24-hour time, as on the mock-ups ("07:30"):
 *   "2026 m. lapkričio 17 d. 07:30" / "November 17, 2026 at 07:30".
 */
export const FORMATS = {
  number: {
    weight: { style: "unit", unit: "kilogram", maximumFractionDigits: 2 },
  },
  dateTime: {
    date: { year: "numeric", month: "long", day: "numeric" },
    dateTime: {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
  },
} as const satisfies Formats;
