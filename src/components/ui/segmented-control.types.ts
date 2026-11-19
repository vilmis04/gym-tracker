import { type ReactNode } from "react";

export interface SegmentedControlOption<Value extends string> {
  value: Value;
  label: string;
  /** Decorative leading visual: a 20 px lucide icon or a small Avatar. */
  icon?: ReactNode;
  /**
   * Language of the label when it differs from the page's (BCP 47, e.g.
   * "lt"), such as a language's native name in the LanguageSwitcher.
   */
  lang?: string;
}

export interface SegmentedControlProps<Value extends string> {
  /** Group name, announced with the checked option. */
  legend: string;
  /** Keep the legend for screen readers only. */
  isLegendHidden?: boolean;
  options: readonly SegmentedControlOption<Value>[];
  /** The checked option; `null` checks none (e.g. before a stored value is known). */
  value: Value | null;
  onValueChange: (value: Value) => void;
  className?: string;
}
