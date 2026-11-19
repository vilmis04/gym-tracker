import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import { MESSAGES } from "../messages";
import { createFormatPresets } from "./create-format-presets";

import type { Locale } from "../i18n.types";

const NOW = new Date("2026-11-19T12:00:00Z");
// 07:30 in Vilnius (UTC+2 in November).
const SESSION_START = new Date("2026-11-17T05:30:00Z");

const createPresets = (locale: Locale, timeZone = "Europe/Vilnius") =>
  createFormatPresets({
    locale,
    timeZone,
    now: NOW,
    translate: createTranslator({
      locale,
      messages: MESSAGES[locale],
      namespace: "format",
    }),
  });

describe("createFormatPresets", () => {
  describe.each([
    {
      locale: "lt",
      weights: ["57,5 kg", "100 kg", "82,25 kg", "0,33 kg", "1 250,5 kg"],
      date: "2026 m. lapkričio 17 d.",
      dateTime: "2026 m. lapkričio 17 d. 07:30",
      dateTimeInNewYork: "2026 m. lapkričio 17 d. 00:30",
      relatives: [
        "prieš 2 dienas",
        "prieš 3 valandas",
        "prieš 30 sekundžių",
        "po 3 dienų",
        "prieš 2 mėnesius",
      ],
      durations: ["1 val. 15 min.", "42 min.", "2 val.", "0 min.", "1 min."],
    },
    {
      locale: "en",
      weights: ["57.5 kg", "100 kg", "82.25 kg", "0.33 kg", "1,250.5 kg"],
      date: "November 17, 2026",
      dateTime: "November 17, 2026 at 07:30",
      dateTimeInNewYork: "November 17, 2026 at 00:30",
      relatives: [
        "2 days ago",
        "3 hours ago",
        "30 seconds ago",
        "in 3 days",
        "2 months ago",
      ],
      durations: ["1 h 15 min", "42 min", "2 h", "0 min", "1 min"],
    },
  ] as const)(
    "$locale",
    ({
      locale,
      weights,
      date,
      dateTime,
      dateTimeInNewYork,
      relatives,
      durations,
    }) => {
      const format = createPresets(locale);

      it("formats weights in kg with up to 2 decimals", () => {
        expect(
          [57.5, 100, 82.25, 0.333, 1250.5].map((kilograms) =>
            format.weight(kilograms),
          ),
        ).toEqual(weights);
      });

      it("formats dates and date-times in the given time zone", () => {
        expect(format.date(SESSION_START)).toBe(date);
        expect(format.dateTime(SESSION_START)).toBe(dateTime);
        expect(format.dateTime(SESSION_START.getTime())).toBe(dateTime);
        expect(
          createPresets(locale, "America/New_York").dateTime(SESSION_START),
        ).toBe(dateTimeInNewYork);
      });

      it("formats relative times from now in the best-fitting unit", () => {
        expect(
          [
            "2026-11-17T12:00:00Z",
            "2026-11-19T09:00:00Z",
            "2026-11-19T11:59:30Z",
            "2026-11-22T12:00:00Z",
            "2026-10-01T12:00:00Z",
          ].map((value) => format.relative(new Date(value))),
        ).toEqual(relatives);
      });

      it("formats durations in hours and minutes, rounded, never negative", () => {
        expect(
          [75, 42, 120, -5, 0.6].map((minutes) => format.duration(minutes)),
        ).toEqual(durations);
      });
    },
  );
});
