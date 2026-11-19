import { createFormatter } from "next-intl";

import { FORMATS } from "./formats";

import type { FormatPresets, FormatPresetsOptions } from "./format.types";

/**
 * The presets behind `useFormat()` and `getFormat()`, on next-intl's
 * formatter (which caches its `Intl` formatters, so build this once per
 * locale / time zone, not per item). Negative durations count as 0.
 */
export function createFormatPresets({
  locale,
  timeZone,
  now,
  translate,
}: FormatPresetsOptions): FormatPresets {
  const formatter = createFormatter({
    locale,
    timeZone,
    now,
    formats: FORMATS,
  });

  const formatDuration = (minutes: number) => {
    const totalMinutes = Math.max(0, Math.round(minutes));
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const remainingMinutes = totalMinutes % MINUTES_PER_HOUR;
    if (hours === 0) {
      return translate("durationMinutes", { minutes: remainingMinutes });
    }
    if (remainingMinutes === 0) return translate("durationHours", { hours });
    return translate("durationHoursMinutes", {
      hours,
      minutes: remainingMinutes,
    });
  };

  return {
    weight: (kilograms) => formatter.number(kilograms, "weight"),
    date: (value) => formatter.dateTime(value, "date"),
    dateTime: (value) => formatter.dateTime(value, "dateTime"),
    relative: (value) => formatter.relativeTime(value, now),
    duration: formatDuration,
  };
}

const MINUTES_PER_HOUR = 60;
