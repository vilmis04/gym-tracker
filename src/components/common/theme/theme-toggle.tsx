"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useId } from "react";

import {
  THEME_PREFERENCE_LABELS,
  THEME_PREFERENCES,
  THEME_TOGGLE_LEGEND,
} from "./theme-preferences";
import { useThemePreference } from "./use-theme-preference";

import type { UseThemePreferenceOptions } from "./theme.types";

/**
 * Light / Dark / System switch (E02-T02): a radio group, so Tab moves into it,
 * the arrow keys change the theme, and screen readers announce the legend and
 * the checked option ("Theme, Dark, radio button, checked, 2 of 3"). Used on
 * the landing page and in the avatar menu (E02-T06).
 */
export function ThemeToggle({
  onThemePreferenceChange,
}: UseThemePreferenceOptions) {
  const { themePreference, setThemePreference } = useThemePreference({
    onThemePreferenceChange,
  });
  // Unique per instance: the toggle can appear twice on a page (menu + settings).
  const radioGroupName = useId();

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-muted-foreground">
        {THEME_TOGGLE_LEGEND}
      </legend>
      <div className="inline-flex w-fit gap-1 rounded-full border border-input p-1">
        {THEME_PREFERENCES.map((preference) => {
          const Icon = THEME_ICONS[preference];
          return (
            <label
              key={preference}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out select-none hover:text-foreground has-checked:bg-primary-soft has-checked:font-semibold has-checked:text-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring motion-reduce:transition-none"
            >
              <input
                type="radio"
                name={radioGroupName}
                value={preference}
                checked={themePreference === preference}
                onChange={() => setThemePreference(preference)}
                className="sr-only"
              />
              <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
              {THEME_PREFERENCE_LABELS[preference]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;
