/**
 * `npm run check:contrast` (E02-T01): computes the WCAG contrast of the key
 * design-token pairs (scripts/contrast/contrast-pairs.mts) in both themes,
 * reading the values from the token file, and fails if any pair is below its
 * minimum. Usage: node scripts/check-contrast.mts [path/to/globals.css]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { checkContrastPairs } from "./contrast/contrast-pairs.mts";
import { readThemeTokens } from "./contrast/theme-tokens.mts";

import type { ContrastResult } from "./contrast/contrast.types.mts";

const DEFAULT_STYLESHEET = fileURLToPath(
  new URL("../src/app/globals.css", import.meta.url),
);

const stylesheetPath = process.argv[2] ?? DEFAULT_STYLESHEET;
const results = checkContrastPairs(
  readThemeTokens(readFileSync(stylesheetPath, "utf8")),
);
const failures = results.filter((result) => !result.isPassing);

console.log(`WCAG contrast of design tokens in ${stylesheetPath}\n`);
for (const result of results) console.log(formatResult(result));

if (failures.length > 0) {
  console.error(
    `\n${failures.length} of ${results.length} token pairs fail. Adjust the token's lightness (not its hue) in the token file and update docs/design-system.md.`,
  );
  process.exitCode = 1;
} else {
  console.log(`\nAll ${results.length} token pairs pass.`);
}

function formatResult(result: ContrastResult): string {
  const status = result.isPassing ? "pass" : "FAIL";
  const ratio =
    result.ratio === null
      ? "  n/a  "
      : `${result.ratio.toFixed(2)}:1`.padStart(7);
  const pair = `--${result.foreground} on --${result.background}`;
  const detail = result.error ?? result.purpose;
  return `${status}  ${result.theme.padEnd(5)}  ${ratio} min ${`${result.minimumRatio}:1`.padEnd(5)}  ${pair.padEnd(48)} ${detail}`;
}
