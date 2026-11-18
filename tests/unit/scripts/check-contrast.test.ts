// @vitest-environment node
/**
 * The pieces of `npm run check:contrast` (E02-T01): WCAG math, reading both
 * themes from the token file, checking the pairs, and the real token file.
 */
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
  checkContrastPairs,
  CONTRAST_PAIRS,
  MINIMUM_CONTRAST,
} from "../../../scripts/contrast/contrast-pairs.mts";
import { readThemeTokens } from "../../../scripts/contrast/theme-tokens.mts";
import {
  getContrastRatio,
  parseHslColor,
} from "../../../scripts/contrast/wcag.mts";

const execFileAsync = promisify(execFile);

const script = fileURLToPath(
  new URL("../../../scripts/check-contrast.mts", import.meta.url),
);
const tokenFile = fileURLToPath(
  new URL("../../../src/app/globals.css", import.meta.url),
);

/** The failing result line, e.g. "FAIL  light   2.01:1 min 4.5:1  --muted-foreground on --background". */
const FAILING_MUTED_TEXT_LINE_REGEX =
  /FAIL {2}light .*--muted-foreground on --background/;

const BLACK = parseHslColor("hsl(0 0% 0%)");
const WHITE = parseHslColor("hsl(0 0% 100%)");

describe("WCAG math", () => {
  it("parses hsl() tokens into 8-bit sRGB", () => {
    // Sand 50 (#FAF7F2) and Sage 500 (#7E9171) from docs/design-system.md.
    expect(parseHslColor("hsl(37.5 44.4% 96.5%)")).toEqual({
      red: 250,
      green: 247,
      blue: 242,
      alpha: 1,
    });
    expect(parseHslColor("hsl(95.6 12.7% 50.6%)")).toMatchObject({
      red: 126,
      green: 145,
      blue: 113,
    });
    expect(parseHslColor("hsl(0 0% 0% / 0.6)").alpha).toBe(0.6);
    expect(parseHslColor("hsl(0 0% 0% / 36%)").alpha).toBe(0.36);
  });

  it("rejects other color syntaxes", () => {
    expect(() => parseHslColor("#ff0000")).toThrow("Unsupported color");
    expect(() => parseHslColor("hsl(0, 0%, 0%)")).toThrow("Unsupported color");
  });

  it("computes the WCAG contrast ratio", () => {
    expect(getContrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5);
    expect(getContrastRatio(WHITE, WHITE)).toBe(1);
    // #767676 on white is the classic 4.54:1 grey.
    expect(
      getContrastRatio(parseHslColor("hsl(0 0% 46.3%)"), WHITE),
    ).toBeCloseTo(4.54, 2);
  });
});

describe("readThemeTokens", () => {
  const stylesheet = `
    @import "tailwindcss";
    @custom-variant dark (&:where(.dark, .dark *));
    /* :root { --ignored: hsl(1 1% 1%); } */
    :root { --background: hsl(0 0% 100%); --foreground: hsl(0 0% 0%); --only-light: hsl(0 0% 50%); }
    .dark { --background: hsl(0 0% 0%); --foreground: hsl(0 0% 100%); }
    :root,
    .dark { --card: var(--background); --card-foreground: var(--foreground); }
    @theme inline { --color-*: initial; --color-card: var(--card); }
    @layer base { body { color: var(--foreground); } }
  `;

  it("reads :root as light and .dark over inherited :root values as dark", () => {
    const { light, dark } = readThemeTokens(stylesheet);

    expect(light.get("background")).toBe("hsl(0 0% 100%)");
    expect(dark.get("background")).toBe("hsl(0 0% 0%)");
    expect(dark.get("only-light")).toBe("hsl(0 0% 50%)");
    expect(light.has("ignored")).toBe(false);
    expect(light.has("color-card")).toBe(false);
  });

  it("resolves var() aliases per theme", () => {
    const { light, dark } = readThemeTokens(stylesheet);

    expect(light.get("card")).toBe("hsl(0 0% 100%)");
    expect(dark.get("card")).toBe("hsl(0 0% 0%)");
    expect(dark.get("card-foreground")).toBe("hsl(0 0% 100%)");
  });

  it("reports unknown and circular references", () => {
    expect(() => readThemeTokens(":root { --card: var(--surface); }")).toThrow(
      "Token --card references --surface, which is not defined.",
    );
    expect(() =>
      readThemeTokens(
        ":root { --first: var(--second); --second: var(--first); }",
      ),
    ).toThrow("Token references loop: --first → --second → --first.");
  });
});

describe("checkContrastPairs", () => {
  const themeTokens = readThemeTokens(`
    :root { --background: hsl(0 0% 100%); --foreground: hsl(0 0% 46.3%); --scrim: hsl(0 0% 0% / 0.5); }
    .dark { --background: hsl(0 0% 0%); --foreground: hsl(0 0% 20%); }
  `);

  it("checks every pair in both themes against its minimum", () => {
    const results = checkContrastPairs(themeTokens, [
      {
        foreground: "foreground",
        background: "background",
        minimumRatio: MINIMUM_CONTRAST.TEXT,
        purpose: "body text",
      },
    ]);

    expect(results).toEqual([
      expect.objectContaining({ theme: "light", isPassing: true }),
      expect.objectContaining({ theme: "dark", isPassing: false }),
    ]);
    expect(results[1]?.ratio).toBeLessThan(MINIMUM_CONTRAST.TEXT);
  });

  it("fails missing and translucent tokens with a reason", () => {
    const results = checkContrastPairs(themeTokens, [
      {
        foreground: "missing",
        background: "background",
        minimumRatio: MINIMUM_CONTRAST.NON_TEXT,
        purpose: "icon",
      },
      {
        foreground: "foreground",
        background: "scrim",
        minimumRatio: MINIMUM_CONTRAST.NON_TEXT,
        purpose: "overlay",
      },
    ]);

    expect(results[0]).toMatchObject({
      ratio: null,
      isPassing: false,
      error: "--missing is not defined.",
    });
    expect(results[1]?.error).toBe(
      "--scrim is translucent; contrast needs opaque colors.",
    );
  });
});

describe("the token file (src/app/globals.css)", () => {
  it("passes every key pair in both themes", () => {
    const results = checkContrastPairs(
      readThemeTokens(readFileSync(tokenFile, "utf8")),
    );

    expect(results).toHaveLength(CONTRAST_PAIRS.length * 2);
    expect(results.filter((result) => !result.isPassing)).toEqual([]);
  });
});

describe("check-contrast.mts", () => {
  it("exits 0 for the token file and 1 when a pair fails", async () => {
    const passing = await execFileAsync(process.execPath, [script]);
    expect(passing.stdout).toContain("token pairs pass");

    const directory = await mkdtemp(join(tmpdir(), "contrast-"));
    const failingStylesheet = join(directory, "globals.css");
    try {
      await writeFile(
        failingStylesheet,
        readFileSync(tokenFile, "utf8").replace(
          "--muted-foreground: hsl(30 9.8% 32.2%);",
          "--muted-foreground: hsl(30 9.8% 70%);",
        ),
      );
      await expect(
        execFileAsync(process.execPath, [script, failingStylesheet]),
      ).rejects.toMatchObject({
        code: 1,
        stdout: expect.stringMatching(FAILING_MUTED_TEXT_LINE_REGEX),
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
