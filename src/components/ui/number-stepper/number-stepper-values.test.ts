import { describe, expect, it } from "vitest";

import { NUMBER_STEPPER_PRESETS } from "./number-stepper-presets";
import {
  clampValue,
  createValueFormat,
  isWithinRange,
  parseDecimalInput,
  stepValue,
} from "./number-stepper-values";

const WEIGHT = NUMBER_STEPPER_PRESETS.weight;
const REPS = NUMBER_STEPPER_PRESETS.reps;

describe("parseDecimalInput", () => {
  it.each([
    ["57,5", 57.5],
    ["57.5", 57.5],
    ["  57,50 ", 57.5],
    ["57", 57],
    ["57,", 57],
    [",5", 0.5],
    [".25", 0.25],
    ["0", 0],
    ["-0", 0],
    ["-2,5", -2.5],
    ["+2.5", 2.5],
    ["1 000,5", 1000.5],
  ])("reads %j as %d", (text, expectedValue) => {
    expect(parseDecimalInput(text, 2)).toBe(expectedValue);
  });

  it.each(["", "   ", ",", "-", "abc", "5,5,5", "57.5kg", "1e3", "5-"])(
    "rejects %j",
    (text) => {
      expect(parseDecimalInput(text, 2)).toBeNull();
    },
  );

  it("rounds digits beyond `decimals` half away from zero, on the digits", () => {
    expect(parseDecimalInput("57,555", 2)).toBe(57.56);
    expect(parseDecimalInput("57,554", 2)).toBe(57.55);
    expect(parseDecimalInput("1.005", 2)).toBe(1.01);
    expect(parseDecimalInput("-1.005", 2)).toBe(-1.01);
    expect(parseDecimalInput("10,5", 0)).toBe(11);
    expect(parseDecimalInput("10,4", 0)).toBe(10);
    expect(parseDecimalInput("0,004", 2)).toBe(0);
  });

  it("rejects numbers too long to store exactly", () => {
    expect(parseDecimalInput("9".repeat(20), 2)).toBeNull();
  });
});

describe("clampValue and isWithinRange", () => {
  it("limits to min and max", () => {
    expect(clampValue(-5, WEIGHT)).toBe(0);
    expect(clampValue(1200, WEIGHT)).toBe(999.75);
    expect(clampValue(57.5, WEIGHT)).toBe(57.5);
    expect(clampValue(0, REPS)).toBe(1);
  });

  it("tells whether a value is in range, bounds included", () => {
    expect(isWithinRange(0, WEIGHT)).toBe(true);
    expect(isWithinRange(999.75, WEIGHT)).toBe(true);
    expect(isWithinRange(999.76, WEIGHT)).toBe(false);
    expect(isWithinRange(0, REPS)).toBe(false);
  });
});

describe("stepValue", () => {
  it("adds and subtracts steps without floating-point drift", () => {
    let weight = 0;
    for (let i = 0; i < 400; i++) weight = stepValue(weight, 1, WEIGHT);
    expect(weight).toBe(999.75);

    const tenthStep = { step: 0.1, min: 0, max: 10, decimals: 1 };
    let value = 0;
    for (let i = 0; i < 3; i++) value = stepValue(value, 1, tenthStep);
    expect(value).toBe(0.3);
  });

  it("keeps the value's offset instead of snapping to multiples of the step", () => {
    expect(stepValue(58.75, 1, WEIGHT)).toBe(61.25);
    expect(stepValue(58.75, -1, WEIGHT)).toBe(56.25);
  });

  it("moves several steps and clamps at the bounds", () => {
    expect(stepValue(50, 10, WEIGHT)).toBe(75);
    expect(stepValue(1, -1, WEIGHT)).toBe(0);
    expect(stepValue(999, 1, WEIGHT)).toBe(999.75);
    expect(stepValue(1, -1, REPS)).toBe(1);
    expect(stepValue(998, 10, REPS)).toBe(999);
  });

  it("starts an empty value at min, or 0 without a lower bound", () => {
    expect(stepValue(null, 1, WEIGHT)).toBe(0);
    expect(stepValue(null, -1, REPS)).toBe(1);
    expect(
      stepValue(null, 1, {
        step: 1,
        min: -Infinity,
        max: Infinity,
        decimals: 0,
      }),
    ).toBe(0);
  });
});

describe("createValueFormat", () => {
  it("uses the locale's decimal separator without trailing zeros or grouping", () => {
    const lithuanian = createValueFormat("lt", 2);
    const english = createValueFormat("en", 2);

    expect(lithuanian.format(57.5)).toBe("57,5");
    expect(english.format(57.5)).toBe("57.5");
    expect(lithuanian.format(999.75)).toBe("999,75");
    expect(english.format(60)).toBe("60");
    expect(english.format(12345.5)).toBe("12345.5");
  });

  it("rounds to `decimals`", () => {
    expect(createValueFormat("en", 0).format(10)).toBe("10");
    expect(createValueFormat("en", 2).format(57.499999999)).toBe("57.5");
  });
});
