import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { readThemeTokens } from "../../../scripts/contrast/theme-tokens.mts";
import { parseHslColor } from "../../../scripts/contrast/wcag.mts";

import type { ThemeName } from "../../../scripts/contrast/contrast.types.mts";

/**
 * Reads the design tokens of one theme from the token file
 * `src/app/globals.css` (E04-T05) and returns a lookup from token name
 * (without `--`) to its color as a six-digit hex string. For images
 * drawn on the server, such as the Open Graph image (`ImageResponse`),
 * which can't resolve CSS custom properties; reading the token file keeps it
 * the only place colors are defined (`npm run check:colors`). Same parser
 * as `npm run check:contrast`. The lookup throws for a missing token or one
 * that isn't an opaque HSL color, so a renamed token fails the build
 * (the Open Graph image is prerendered).
 */
export async function readTokenColors(
  theme: ThemeName,
): Promise<(tokenName: string) => string> {
  const tokens = readThemeTokens(await readFile(TOKEN_FILE_PATH, "utf8"))[
    theme
  ];
  return (tokenName) => {
    const value = tokens.get(tokenName);
    if (value === undefined) {
      throw new Error(`Design token --${tokenName} is not defined.`);
    }
    return convertToHex(tokenName, value);
  };
}

// Relative to the project root, where `next build` runs. Not
// `new URL(…, import.meta.url)`: the bundler would treat the CSS file as a
// stylesheet import.
const TOKEN_FILE_PATH = join(process.cwd(), "src/app/globals.css");

const convertToHex = (tokenName: string, value: string): string => {
  const { red, green, blue, alpha } = parseHslColor(value);
  if (alpha !== 1) {
    throw new Error(`Design token --${tokenName} must be opaque.`);
  }
  const hexDigits = [red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("");
  return `#${hexDigits}`;
};
