import { expect, test } from "@playwright/test";

import {
  type FakeSentry,
  fakeSentryPort,
  startFakeSentry,
} from "./helpers/fake-sentry";

// E01-T07: errors thrown in a Server Component and in a client component
// reach error tracking with the release tag, a stack trace and no PII.
// There is no real Sentry project in CI, so the app is built with a DSN that
// points at a local fake ingest server (helpers/fake-sentry.ts):
//
//   NEXT_PUBLIC_SENTRY_DSN=http://public@127.0.0.1:8999/1 \
//   ENABLE_TEST_ERROR_PAGE=1 APP_VERSION=local-test CI=1 npm run e2e
//
// Without such a DSN the spec is skipped.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const port = fakeSentryPort(dsn);
const release = process.env.APP_VERSION;
const testEmail = "test-user@example.com";

test.skip(
  !port || process.env.ENABLE_TEST_ERROR_PAGE !== "1",
  "Needs NEXT_PUBLIC_SENTRY_DSN=http://public@127.0.0.1:<port>/1 and ENABLE_TEST_ERROR_PAGE=1 (set in the CI e2e job)",
);
// One fake server per port: run in a single project.
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Runs on chromium only",
);
test.describe.configure({ mode: "serial" });

let sentry: FakeSentry | undefined;

test.beforeAll(async ({ browserName }) => {
  if (port && browserName === "chromium") sentry = await startFakeSentry(port);
});

test.afterAll(async () => {
  await sentry?.close();
});

async function waitForEvent(match: string) {
  let found: NonNullable<FakeSentry>["events"][number] | undefined;
  await expect
    .poll(
      () => {
        found = sentry?.events.find((event) =>
          event.exception?.values?.some((value) =>
            value.value?.includes(match),
          ),
        );
        return Boolean(found);
      },
      {
        message: `an event for "${match}" reaches the fake Sentry`,
        timeout: 20_000,
      },
    )
    .toBe(true);
  return found!;
}

function expectReadableEvent(event: Awaited<ReturnType<typeof waitForEvent>>) {
  if (release) expect(event.release).toBe(release);
  else expect(event.release).toBeTruthy();

  const exception = event.exception?.values?.at(-1);
  // The fake email in the error message was scrubbed.
  expect(exception?.value).toContain("[email]");
  expect(exception?.stacktrace?.frames?.length).toBeGreaterThan(0);
  expect(exception?.stacktrace?.frames?.some((frame) => frame.filename)).toBe(
    true,
  );
  expect(event.user?.email).toBeUndefined();
}

test("an error in a Server Component is reported with the release and no PII", async ({
  page,
}) => {
  await page.goto("/debug/error?throw=server");
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();

  const event = await waitForEvent("Test Server Component error");
  expect(event.platform).toBe("node");
  expectReadableEvent(event);
  expect(sentry!.envelopes.join("\n")).not.toContain(testEmail);
});

test("an error in a client component is reported with the release and no PII", async ({
  page,
}) => {
  await page.goto("/debug/error");
  await page
    .getByRole("button", { name: "Throw in a client component" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();

  const event = await waitForEvent("Test client component error");
  expect(event.platform).toBe("javascript");
  expect(event.sdk?.name).toContain("nextjs");
  expectReadableEvent(event);
  expect(sentry!.envelopes.join("\n")).not.toContain(testEmail);
});
