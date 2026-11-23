import { type ReactNode } from "react";

/** What a NumberStepper accepts; see NUMBER_STEPPER_PRESETS. */
export interface NumberStepperRange {
  /** How much − / + and the arrow keys change the value. */
  step: number;
  min: number;
  /** `Infinity` for no upper bound. */
  max: number;
  /** Fraction digits kept (typed digits beyond are rounded); 0 = integers. */
  decimals: number;
}

export interface NumberStepperProps extends Partial<NumberStepperRange> {
  /** The stored number; `null` while there's none yet (shows `placeholder`). */
  value: number | null;
  /** Called with the parsed, rounded and clamped number, never the text. */
  onChange: (value: number) => void;
  /**
   * Accessible name of the field and of its −/+ group ("Weight", "Reps").
   * The visible label comes from the surrounding FormField.
   */
  label: string;
  /** Unit read out with the value ("57,5 kg") and in the button names. */
  unit?: string;
  /**
   * BCP 47 locale for the decimal separator ("lt" → "57,5", "en" → "57.5").
   * Defaults to next-intl's active locale.
   */
  locale?: string;
  /** Shown while `value` is `null`. */
  placeholder?: string;
  /** Accessible name of the − button; defaults to "Decrease by {step} {unit}". */
  decreaseLabel?: string;
  /** Accessible name of the + button; defaults to "Increase by {step} {unit}". */
  increaseLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Set by FormField: the input's id, description and error state. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export interface StepperButtonProps {
  label: string;
  /** At min (−) or max (+): announced as unavailable and ignored. */
  isAtBound: boolean;
  disabled: boolean;
  className: string;
  /** The icon. */
  children: ReactNode;
  /** A pointer went down: step now and start repeating. */
  onPressStart: () => void;
  /** The pointer went up, left or was cancelled, or the button lost focus. */
  onPressEnd: () => void;
  /** One step from the keyboard or assistive technology. */
  onStep: () => void;
}
