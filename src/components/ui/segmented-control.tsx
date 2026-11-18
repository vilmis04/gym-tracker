"use client";

import { useId } from "react";

import { cn } from "@/lib/utils/cn";

import type { SegmentedControlProps } from "./segmented-control.types";

/**
 * One-of-n switch (E02-T03), e.g. the participant switcher in a live session
 * or the theme toggle. Native radio buttons in a `fieldset`, so Tab moves
 * into the group, the arrow keys change the choice, and screen readers
 * announce the legend and the checked option. Pill shaped, 44 px targets,
 * checked option on `bg-primary-soft` in semibold.
 */
export function SegmentedControl<Value extends string>({
  legend,
  isLegendHidden = false,
  options,
  value,
  onValueChange,
  className,
}: SegmentedControlProps<Value>) {
  // Unique per instance: the same control can appear twice on a page.
  const radioGroupName = useId();

  return (
    <fieldset className={className}>
      <legend
        className={cn(
          "mb-2 text-sm font-medium text-muted-foreground",
          isLegendHidden && "sr-only",
        )}
      >
        {legend}
      </legend>
      <div className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-full border border-input p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out select-none hover:text-foreground has-checked:bg-primary-soft has-checked:font-semibold has-checked:text-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring"
          >
            <input
              type="radio"
              name={radioGroupName}
              value={option.value}
              checked={value === option.value}
              onChange={() => onValueChange(option.value)}
              className="sr-only"
            />
            {option.icon}
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
