import { getContrastRatio, parseHslColor } from "./wcag.mts";

import type {
  ContrastPair,
  ContrastResult,
  ThemeName,
  ThemeTokens,
} from "./contrast.types.mts";

/** WCAG 2.1 AA: 1.4.3 (text) and 1.4.11 (UI components, graphical objects). */
export const MINIMUM_CONTRAST = {
  TEXT: 4.5,
  NON_TEXT: 3,
} as const;

const textPair = (
  foreground: string,
  background: string,
  purpose: string,
): ContrastPair => ({
  foreground,
  background,
  minimumRatio: MINIMUM_CONTRAST.TEXT,
  purpose,
});

const nonTextPair = (
  foreground: string,
  background: string,
  purpose: string,
): ContrastPair => ({
  foreground,
  background,
  minimumRatio: MINIMUM_CONTRAST.NON_TEXT,
  purpose,
});

const CHART_TOKENS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

/**
 * The key token pairs, checked in both themes. Every text pair is held to
 * 4.5:1, so large text (3:1) passes too. `--border` is not listed: it only
 * draws decorative dividers (WCAG 1.4.11 does not apply); control boundaries
 * use `--input`, which is.
 */
export const CONTRAST_PAIRS: ContrastPair[] = [
  textPair("foreground", "background", "body text"),
  textPair("foreground", "surface", "text on surfaces"),
  textPair("card-foreground", "card", "card text"),
  textPair("popover-foreground", "popover", "menu and dialog text"),
  textPair("muted-foreground", "background", "secondary text and icons"),
  textPair("muted-foreground", "muted", "secondary text on muted surfaces"),
  textPair("primary", "background", "primary text, active nav label"),
  textPair("primary", "primary-soft", "primary text on the soft tint"),
  textPair("foreground", "primary-soft", "text on the soft tint"),
  textPair("primary-foreground", "primary", "primary button label"),
  textPair("secondary-foreground", "secondary", "secondary button label"),
  textPair("accent-foreground", "accent", "highlighted item text"),
  textPair("success-foreground", "success", "success message"),
  textPair("warning-foreground", "warning", "warning message"),
  textPair("destructive-foreground", "destructive", "destructive button label"),
  textPair("destructive", "background", "error text"),
  textPair("destructive", "surface", "error text on surfaces"),
  nonTextPair("input", "background", "control border"),
  nonTextPair("input", "surface", "control border on surfaces"),
  nonTextPair("ring", "background", "focus ring"),
  nonTextPair("ring", "surface", "focus ring on surfaces"),
  ...CHART_TOKENS.flatMap((chartToken) => [
    nonTextPair(chartToken, "background", "chart series"),
    nonTextPair(chartToken, "card", "chart series on cards"),
  ]),
];

/** Checks every pair in every theme; never throws, problems are results. */
export function checkContrastPairs(
  themeTokens: ThemeTokens,
  pairs: ContrastPair[] = CONTRAST_PAIRS,
): ContrastResult[] {
  const themes = Object.keys(themeTokens) as ThemeName[];
  return themes.flatMap((theme) =>
    pairs.map((pair) => checkPair(themeTokens, theme, pair)),
  );
}

function checkPair(
  themeTokens: ThemeTokens,
  theme: ThemeName,
  pair: ContrastPair,
): ContrastResult {
  const readOpaqueColor = (token: string) => {
    const value = themeTokens[theme].get(token);
    if (value === undefined) throw new Error(`--${token} is not defined.`);
    const color = parseHslColor(value);
    if (color.alpha < 1) {
      throw new Error(
        `--${token} is translucent; contrast needs opaque colors.`,
      );
    }
    return color;
  };

  try {
    const ratio = getContrastRatio(
      readOpaqueColor(pair.foreground),
      readOpaqueColor(pair.background),
    );
    return { ...pair, theme, ratio, isPassing: ratio >= pair.minimumRatio };
  } catch (error) {
    return {
      ...pair,
      theme,
      ratio: null,
      isPassing: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
