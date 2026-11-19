import { expect, test } from "@playwright/test";

// E02-T01: the tokens preview renders both themes (toggle from E02-T02), and the Lithuanian letters
// are drawn with Inter itself (its latin-ext subset), not a fallback font.
// /dev/* is a 404 in production builds unless ENABLE_DEV_PAGES=1 (set in the
// CI e2e job); `next dev` always serves it.
test.skip(
  Boolean(process.env.CI) && process.env.ENABLE_DEV_PAGES !== "1",
  "Needs ENABLE_DEV_PAGES=1 against a production build (set in the CI e2e job)",
);

const LITHUANIAN_LETTERS = "ąčęėįšųūžĄČĘĖĮŠŲŪŽ";

test("Lithuanian letters render in Inter with no fallback font", async ({
  page,
}) => {
  await page.goto("/dev/tokens");
  const sample = page.getByTestId("lithuanian-sample");
  await expect(sample).toHaveText("ąčęėįšųūž ĄČĘĖĮŠŲŪŽ");

  const uncoveredLetters = await sample.evaluate(async (element, letters) => {
    await document.fonts.ready;
    // One range of a FontFace's unicode-range, e.g. "U+100-2BA" or "U+131".
    const UNICODE_RANGE_REGEX = /^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/i;
    const firstFamily = getComputedStyle(element)
      .fontFamily.split(",")[0]
      ?.trim()
      .replaceAll('"', "");
    const ranges = [...document.fonts]
      .filter((face) => face.family === firstFamily && face.status === "loaded")
      .flatMap((face) => face.unicodeRange.split(","))
      .map((range) => UNICODE_RANGE_REGEX.exec(range.trim()))
      .filter((match) => match !== null)
      .map(([, start = "0", end]) => [
        parseInt(start, 16),
        parseInt(end ?? start, 16),
      ]);
    return {
      firstFamily,
      letters: [...letters].filter((letter) => {
        const codePoint = letter.codePointAt(0) ?? 0;
        return !ranges.some(
          ([start = 0, end = 0]) => codePoint >= start && codePoint <= end,
        );
      }),
    };
  }, LITHUANIAN_LETTERS);

  expect(uncoveredLetters).toEqual({ firstFamily: "Inter", letters: [] });
});

test("the theme toggle renders the page with the dark tokens", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/dev/tokens");

  await page.getByText("Dark", { exact: true }).click();

  // --background in the dark theme: hsl(36 9.8% 10%).
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(28, 26, 23)",
  );
});
