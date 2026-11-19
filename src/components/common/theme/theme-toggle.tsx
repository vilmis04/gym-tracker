"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { SegmentedControl } from "@/components/ui/segmented-control";

import {
  THEME_PREFERENCE_OPTIONS,
  THEME_PREFERENCES,
} from "./theme-preferences";
import { useThemePreference } from "./use-theme-preference";

import type { UseThemePreferenceOptions } from "./theme.types";

/**
 * Light / Dark / System switch (E02-T02): a SegmentedControl (native radio
 * group), so Tab moves into it, the arrow keys change the theme, and screen
 * readers announce the legend and the checked option ("Theme, Dark, radio
 * button, checked, 2 of 3"). Used on the landing page and the `/dev` pages;
 * the avatar menu offers the same choices as menu items (E02-T06).
 */
export function ThemeToggle({
  onThemePreferenceChange,
}: UseThemePreferenceOptions) {
  const translate = useTranslations("common");
  const { themePreference, setThemePreference } = useThemePreference({
    onThemePreferenceChange,
  });

  const options = useMemo(
    () =>
      THEME_PREFERENCES.map((preference) => {
        const { labelKey, Icon } = THEME_PREFERENCE_OPTIONS[preference];
        return {
          value: preference,
          label: translate(labelKey),
          icon: <Icon aria-hidden="true" size={20} strokeWidth={1.5} />,
        };
      }),
    [translate],
  );

  return (
    <SegmentedControl
      legend={translate("theme")}
      options={options}
      value={themePreference ?? null}
      onValueChange={setThemePreference}
    />
  );
}
