"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";

import {
  THEME_PREFERENCE_LABELS,
  THEME_PREFERENCES,
  THEME_TOGGLE_LEGEND,
} from "./theme-preferences";
import { useThemePreference } from "./use-theme-preference";

import type { UseThemePreferenceOptions } from "./theme.types";

/**
 * Light / Dark / System switch (E02-T02): a SegmentedControl (native radio
 * group), so Tab moves into it, the arrow keys change the theme, and screen
 * readers announce the legend and the checked option ("Theme, Dark, radio
 * button, checked, 2 of 3"). Used on the landing page and in the avatar menu
 * (E02-T06).
 */
export function ThemeToggle({
  onThemePreferenceChange,
}: UseThemePreferenceOptions) {
  const { themePreference, setThemePreference } = useThemePreference({
    onThemePreferenceChange,
  });

  return (
    <SegmentedControl
      legend={THEME_TOGGLE_LEGEND}
      options={THEME_OPTIONS}
      value={themePreference ?? null}
      onValueChange={setThemePreference}
    />
  );
}

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const THEME_OPTIONS = THEME_PREFERENCES.map((preference) => {
  const Icon = THEME_ICONS[preference];
  return {
    value: preference,
    label: THEME_PREFERENCE_LABELS[preference],
    icon: <Icon aria-hidden="true" size={20} strokeWidth={1.5} />,
  };
});
