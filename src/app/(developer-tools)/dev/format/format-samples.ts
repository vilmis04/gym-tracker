import type { FormatPresets } from "@/lib/i18n/format/format.types";

import type { FormatSample } from "./format-samples.types";

/** 07:30 in Vilnius (UTC+2 in November), 00:30 in New York. */
const SAMPLE_DATE = new Date("2026-11-17T05:30:00Z");

/** Every preset on fixed sample values, for the server and client lists. */
export function getFormatSamples(format: FormatPresets): FormatSample[] {
  return [
    { call: "weight(57.5)", text: format.weight(57.5) },
    { call: "weight(1250.25)", text: format.weight(1250.25) },
    { call: "date(2026-11-17T05:30Z)", text: format.date(SAMPLE_DATE) },
    { call: "dateTime(2026-11-17T05:30Z)", text: format.dateTime(SAMPLE_DATE) },
    { call: "relative(2026-11-17T05:30Z)", text: format.relative(SAMPLE_DATE) },
    { call: "duration(75)", text: format.duration(75) },
    { call: "duration(42)", text: format.duration(42) },
  ];
}
