"use client";

import { Minus, Plus } from "lucide-react";
import { useLocale } from "next-intl";
import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils/cn";

import { FIELD_CLASS_NAME } from "../input";
import { UI_LABELS } from "../ui-labels";
import {
  clampValue,
  createValueFormat,
  isWithinRange,
  parseDecimalInput,
  stepValue,
} from "./number-stepper-values";
import { StepperButton } from "./stepper-button";
import { useAutoRepeat } from "./use-auto-repeat";

import type { NumberStepperProps } from "./number-stepper.types";

/**
 * Number field with big − / + buttons for weight and reps (E02-T05), as in
 * the Live session mock-up: 56 px, `bg-surface`, 48 × 56 px buttons.
 *
 * ```tsx
 * <FormField label="Weight">
 *   <NumberStepper {...NUMBER_STEPPER_PRESETS.weight} label="Weight" value={weight} onChange={setWeight} />
 * </FormField>
 * ```
 *
 * - Typing accepts `,` and `.`; a valid in-range number is passed to
 *   `onChange` as it's typed. On blur (or Enter) it's clamped to min/max;
 *   anything that isn't a number reverts to `value`. The value is shown with
 *   the locale's separator when the field isn't being edited.
 * - Holding − / + repeats, faster and faster (useAutoRepeat). The new value
 *   is announced in a polite live region after a tap and once on release,
 *   not on every repeat.
 * - The input is a `spinbutton`: ↑ / ↓ step, Page Up / Page Down step 10×;
 *   screen readers read its `aria-valuetext` ("57,5 kg") on those changes.
 */
export function NumberStepper({
  value,
  onChange,
  label,
  step = 1,
  min = 0,
  max = Infinity,
  decimals = 0,
  unit,
  locale,
  placeholder = EMPTY_VALUE_PLACEHOLDER,
  decreaseLabel,
  increaseLabel,
  disabled = false,
  className,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": isInvalid,
}: NumberStepperProps) {
  const activeLocale = useLocale();
  const formatLocale = locale ?? activeLocale;
  const range = { step, min, max, decimals };
  const valueFormat = useMemo(
    () => createValueFormat(formatLocale, decimals),
    [formatLocale, decimals],
  );
  // The text being edited; `null` while the field shows `value`. Mirrored in
  // a ref because a −/+ press (pointerdown) commits it before the input's
  // blur handler runs, and the blur must then see that it's gone.
  const [draftText, setDraftText] = useState<string | null>(null);
  const draftTextRef = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  // The value during a press and hold, ahead of the `value` prop.
  const pressValueRef = useRef<number | null>(null);
  const autoRepeat = useAutoRepeat();

  const formatWithUnit = (number: number) =>
    [valueFormat.format(number), unit].filter(Boolean).join(" ");
  const displayedText = value === null ? "" : valueFormat.format(value);
  const stepText = formatWithUnit(step);
  const isAtMin = value !== null && value <= min;
  const isAtMax = value !== null && value >= max;

  const updateDraft = (text: string | null) => {
    draftTextRef.current = text;
    setDraftText(text);
  };

  const changeValue = (nextValue: number) => {
    if (nextValue !== value) onChange(nextValue);
  };

  /** Ends editing: stores the clamped typed number, or reverts. Returns the value now in effect. */
  const commitDraft = (): number | null => {
    const text = draftTextRef.current;
    if (text === null) return value;
    updateDraft(null);
    const parsedValue = parseDecimalInput(text, decimals);
    if (parsedValue === null) return value;
    const clampedValue = clampValue(parsedValue, range);
    changeValue(clampedValue);
    return clampedValue;
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    updateDraft(text);
    const parsedValue = parseDecimalInput(text, decimals);
    if (parsedValue !== null && isWithinRange(parsedValue, range)) {
      changeValue(parsedValue);
    }
  };

  const handleInputFocus = (event: FocusEvent<HTMLInputElement>) => {
    // Typing replaces the value instead of appending to it.
    event.currentTarget.select();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      commitDraft();
      return;
    }
    const stepCount = KEY_STEP_COUNTS[event.key];
    if (stepCount === undefined) return;
    event.preventDefault();
    changeValue(stepValue(commitDraft(), stepCount, range));
  };

  /** One step from `currentValue`; `false` when a bound stops it. */
  const stepPress = (stepCount: number) => {
    const currentValue = pressValueRef.current;
    const nextValue = stepValue(currentValue, stepCount, range);
    if (nextValue === currentValue) return false;
    pressValueRef.current = nextValue;
    onChange(nextValue);
    return true;
  };

  const startPress = (stepCount: number) => {
    pressValueRef.current = commitDraft();
    stepPress(stepCount);
    autoRepeat.start(() => stepPress(stepCount));
  };

  const endPress = () => {
    autoRepeat.stop();
    const pressValue = pressValueRef.current;
    if (pressValue === null) return;
    pressValueRef.current = null;
    setAnnouncement(formatWithUnit(pressValue));
  };

  const stepOnce = (stepCount: number) => {
    pressValueRef.current = commitDraft();
    stepPress(stepCount);
    endPress();
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("relative w-full", className)}
    >
      <input
        id={id}
        type="text"
        role="spinbutton"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        autoComplete="off"
        aria-label={label}
        aria-describedby={describedBy}
        aria-invalid={isInvalid}
        aria-valuenow={value ?? undefined}
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
        aria-valuetext={value === null ? undefined : formatWithUnit(value)}
        placeholder={placeholder}
        disabled={disabled}
        value={draftText ?? displayedText}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={commitDraft}
        onKeyDown={handleInputKeyDown}
        className={cn(
          FIELD_CLASS_NAME,
          "h-14 px-12 text-center text-xl font-semibold tabular-nums placeholder:font-normal",
        )}
      />
      <StepperButton
        label={decreaseLabel ?? UI_LABELS.numberStepperDecrease(stepText)}
        isAtBound={isAtMin}
        disabled={disabled}
        className="left-0"
        onPressStart={() => startPress(-1)}
        onPressEnd={endPress}
        onStep={() => stepOnce(-1)}
      >
        <Minus aria-hidden="true" size={20} strokeWidth={1.5} />
      </StepperButton>
      <StepperButton
        label={increaseLabel ?? UI_LABELS.numberStepperIncrease(stepText)}
        isAtBound={isAtMax}
        disabled={disabled}
        className="right-0"
        onPressStart={() => startPress(1)}
        onPressEnd={endPress}
        onStep={() => stepOnce(1)}
      >
        <Plus aria-hidden="true" size={20} strokeWidth={1.5} />
      </StepperButton>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}

// The mock-ups' "no value" mark.
const EMPTY_VALUE_PLACEHOLDER = "—";

// How many steps a key moves the value (the ARIA spinbutton pattern). Home /
// End are left to move the caret in the text.
const KEY_STEP_COUNTS: Partial<Record<string, number>> = {
  ArrowUp: 1,
  ArrowDown: -1,
  PageUp: 10,
  PageDown: -10,
};
