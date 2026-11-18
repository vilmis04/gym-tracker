import type { NumberStepperRange } from "./number-stepper.types";

/**
 * Parses what was typed into a NumberStepper: `,` and `.` are both decimal
 * separators and spaces (including the no-break spaces of Lithuanian digit
 * groups) are ignored, so "57,5", "57.5" and "  57,50 " are all 57.5.
 * Digits beyond `decimals` are rounded half away from zero ("57,555" → 57.56
 * with 2 decimals, "10.5" → 11 with 0). Returns `null` for anything that
 * isn't a number ("", "abc", "5,5,5"). The rounding works on the digits, so
 * it doesn't suffer from floating-point error (1.005 → 1.01, not 1).
 */
export function parseDecimalInput(
  text: string,
  decimals: number,
): number | null {
  const match = DECIMAL_INPUT_REGEX.exec(text.replace(WHITESPACE_REGEX, ""));
  if (match === null) return null;

  const [, sign = "", integerDigits = "", fractionDigits = ""] = match;
  if (integerDigits === "" && fractionDigits === "") return null;

  const keptFractionDigits = fractionDigits
    .slice(0, decimals)
    .padEnd(decimals, "0");
  const shouldRoundUp = fractionDigits.charAt(decimals) >= "5";
  const scaledMagnitude =
    Number(`${integerDigits}${keptFractionDigits}` || "0") +
    (shouldRoundUp ? 1 : 0);
  if (!Number.isSafeInteger(scaledMagnitude)) return null;
  if (scaledMagnitude === 0) return 0;

  return fromScaledInteger(
    sign === "-" ? -scaledMagnitude : scaledMagnitude,
    decimals,
  );
}

/** `value` limited to `min`…`max`. */
export function clampValue(
  value: number,
  { min, max }: Pick<NumberStepperRange, "min" | "max">,
): number {
  return Math.min(max, Math.max(min, value));
}

export function isWithinRange(
  value: number,
  { min, max }: Pick<NumberStepperRange, "min" | "max">,
): boolean {
  return value >= min && value <= max;
}

/**
 * `value` moved by `stepCount` steps (negative = down), clamped. Computed in
 * integers scaled by 10^decimals, so 2.5 steps never drift (0.1 + 0.2 style
 * errors). Steps are added to the value as it is, not snapped to multiples
 * of `step`: 58.75 + 2.5 = 61.25. Without a value it starts at `min` (or 0
 * when there's no lower bound).
 */
export function stepValue(
  value: number | null,
  stepCount: number,
  { step, min, max, decimals }: NumberStepperRange,
): number {
  const range = { min, max };
  if (value === null) {
    return clampValue(Number.isFinite(min) ? min : 0, range);
  }

  const nextScaledValue =
    toScaledInteger(value, decimals) +
    stepCount * toScaledInteger(step, decimals);
  return clampValue(fromScaledInteger(nextScaledValue, decimals), range);
}

/**
 * The formatter for showing a value while it isn't being edited: the
 * locale's decimal separator ("57,5" in `lt`, "57.5" in `en`), up to
 * `decimals` fraction digits without trailing zeros, and no digit grouping
 * (the field is narrow and the text must stay editable).
 */
export function createValueFormat(
  locale: string,
  decimals: number,
): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals,
    useGrouping: false,
  });
}

// Optional sign, digits, optional `,` or `.` and more digits. Matches "57",
// "57,5", "57.50", ".5", "57,", "-2.5"; not "5,5,5", "1e3" or "abc".
const DECIMAL_INPUT_REGEX = /^([+-])?(\d*)(?:[.,](\d*))?$/;

// Any whitespace, including no-break and narrow no-break spaces: matches
// " ", " ", " ".
const WHITESPACE_REGEX = /\s/g;

const toScaledInteger = (value: number, decimals: number) =>
  Math.round(value * 10 ** decimals);

const fromScaledInteger = (scaledValue: number, decimals: number) =>
  scaledValue / 10 ** decimals;
