import { expect, test, type Page } from "@playwright/test";

import { TIME_ZONE_COOKIE_NAME } from "../../src/lib/i18n/time-zone";

// E03-T03: the formatting presets render the same on the server
// (`getFormat()`) and in client components (`useFormat()`), in both
// locales, without hydration mismatches; times follow the browser's time
// zone, which reaches the server through the time zone cookie. Uses the
// /dev/format preview: 404 in production builds unless ENABLE_DEV_PAGES=1
// (set in the CI e2e job); `next dev` always serves it.
test.skip(
  Boolean(process.env.CI) && process.env.ENABLE_DEV_PAGES !== "1",
  "Needs ENABLE_DEV_PAGES=1 against a production build (set in the CI e2e job)",
);

// Not the server's default (Europe/Vilnius), so a wrong zone shows.
test.use({ timezoneId: "America/New_York" });

/**
 * Console errors and warnings and uncaught errors (hydration mismatches end
 * up there). Failed requests are left out: the e2e build reports errors to a
 * fake Sentry DSN nothing listens on here.
 */
const collectPageProblems = (page: Page) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    const isProblem =
      message.type() === "error" || message.type() === "warning";
    if (isProblem && !message.text().startsWith(FAILED_REQUEST_PREFIX)) {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
};

const FAILED_REQUEST_PREFIX = "Failed to load resource";

const getSampleTexts = (page: Page, label: string) =>
  page.getByRole("region", { name: label }).getByRole("definition");

test("server and client render the presets alike in both locales, in the browser's time zone", async ({
  page,
  context,
}) => {
  const problems = collectPageProblems(page);

  // First visit: no cookie yet, so the server renders Vilnius time; the
  // client lists switch to New York right after hydrating, without a
  // mismatch, and the browser writes the cookie.
  await page.goto("/dev/format");
  await expect(getSampleTexts(page, "Server · lt").nth(3)).toHaveText(
    "2026 m. lapkričio 17 d. 07:30",
  );
  await expect(getSampleTexts(page, "Client · lt").nth(3)).toHaveText(
    "2026 m. lapkričio 17 d. 00:30",
  );
  await expect(getSampleTexts(page, "Client · en").nth(3)).toHaveText(
    "November 17, 2026 at 00:30",
  );
  await expect
    .poll(async () =>
      (await context.cookies()).find(
        ({ name }) => name === TIME_ZONE_COOKIE_NAME,
      ),
    )
    .toMatchObject({ value: "America%2FNew_York", path: "/" });

  // With the cookie, the server renders New York time too, and every
  // server text equals its client twin (same ICU output in Node and the
  // browser).
  await page.reload();
  await expect(
    page.getByText("time zone cookie: America/New_York"),
  ).toBeVisible();
  for (const locale of ["lt", "en"]) {
    const serverTexts = await getSampleTexts(
      page,
      `Server · ${locale}`,
    ).allTextContents();
    await expect(getSampleTexts(page, `Client · ${locale}`)).toHaveText(
      serverTexts,
    );
  }
  await expect(getSampleTexts(page, "Server · lt")).toHaveText([
    "57,5 kg",
    "1 250,25 kg",
    "2026 m. lapkričio 17 d.",
    "2026 m. lapkričio 17 d. 00:30",
    /^prieš \d+ /,
    "1 val. 15 min.",
    "42 min.",
  ]);
  await expect(getSampleTexts(page, "Server · en")).toHaveText([
    "57.5 kg",
    "1,250.25 kg",
    "November 17, 2026",
    "November 17, 2026 at 00:30",
    /ago$/,
    "1 h 15 min",
    "42 min",
  ]);

  expect(problems).toEqual([]);
});
