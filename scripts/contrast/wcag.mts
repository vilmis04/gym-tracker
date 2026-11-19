import type { RgbColor } from "./contrast.types.mts";

/**
 * Parses the `hsl()` syntax the tokens use: space-separated, optional alpha.
 * Matches "hsl(37.5 44.4% 96.5%)", "hsl(0 0% 0% / 0.6)", "hsl(0 0% 0% / 60%)".
 */
const HSL_COLOR_REGEX =
  /^hsl\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*(?:\/\s*(\d+(?:\.\d+)?)(%?)\s*)?\)$/;

/** Parses a token value; throws on anything but the `hsl()` form above. */
export function parseHslColor(value: string): RgbColor {
  const match = HSL_COLOR_REGEX.exec(value.trim());
  if (!match) {
    throw new Error(
      `Unsupported color "${value}": tokens must be hsl(<hue> <saturation>% <lightness>% [/ <alpha>]).`,
    );
  }
  const [, hue, saturation, lightness, alpha, alphaPercentSign] = match;
  const alphaValue = alpha === undefined ? 1 : Number(alpha);

  return {
    ...convertHslToRgb(
      Number(hue),
      Number(saturation) / 100,
      Number(lightness) / 100,
    ),
    alpha: alphaPercentSign ? alphaValue / 100 : alphaValue,
  };
}

/** WCAG 2.x contrast ratio (1–21) between two opaque colors. */
export function getContrastRatio(first: RgbColor, second: RgbColor): number {
  const firstLuminance = getRelativeLuminance(first);
  const secondLuminance = getRelativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG 2.x relative luminance of an sRGB color (channels 0–255). */
export function getRelativeLuminance({ red, green, blue }: RgbColor): number {
  return (
    0.2126 * linearizeChannel(red) +
    0.7152 * linearizeChannel(green) +
    0.0722 * linearizeChannel(blue)
  );
}

// Browsers round HSL to 8-bit sRGB channels before painting, so the ratio is
// computed on the same rounded values a contrast checker would pick from screen.
function convertHslToRgb(
  hue: number,
  saturation: number,
  lightness: number,
): Omit<RgbColor, "alpha"> {
  const chroma = saturation * Math.min(lightness, 1 - lightness);
  const getChannel = (offset: number) => {
    const position = (offset + hue / 30) % 12;
    const channel =
      lightness -
      chroma * Math.max(-1, Math.min(position - 3, 9 - position, 1));
    return Math.round(channel * 255);
  };
  return { red: getChannel(0), green: getChannel(8), blue: getChannel(4) };
}

function linearizeChannel(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}
