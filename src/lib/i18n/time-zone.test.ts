import { describe, expect, it } from "vitest";

import { DEFAULT_TIME_ZONE, timeZoneSchema } from "./time-zone";

describe("timeZoneSchema", () => {
  it.each(["Europe/Vilnius", "America/New_York", "UTC", "Asia/Kolkata"])(
    "accepts the IANA zone %s",
    (timeZone) => {
      expect(timeZoneSchema.safeParse(timeZone).success).toBe(true);
    },
  );

  it.each(["", "Mars/Olympus_Mons", "Europe/Vilnius; path=/", "x".repeat(65)])(
    "rejects %j",
    (timeZone) => {
      expect(timeZoneSchema.safeParse(timeZone).success).toBe(false);
    },
  );

  it("defaults to Vilnius", () => {
    expect(DEFAULT_TIME_ZONE).toBe("Europe/Vilnius");
  });
});
