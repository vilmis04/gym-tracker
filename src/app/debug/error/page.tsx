import { notFound } from "next/navigation";
import { connection } from "next/server";

import { ThrowInClient } from "./throw-in-client";

/**
 * Error-tracking smoke test (E01-T07), off unless the server runs with
 * `ENABLE_TEST_ERROR_PAGE=1` (404 otherwise). Developer-only, so the copy is
 * not translated.
 *
 * - `/debug/error?throw=server` throws while rendering this Server Component
 *   (reported by `onRequestError` in src/instrumentation.ts).
 * - The button throws while rendering a client component (reported by
 *   src/app/global-error.tsx).
 *
 * Both messages contain a fake email address, so the event shows that PII
 * scrubbing works (it must arrive as `[email]`).
 */
export default async function TestErrorPage({
  searchParams,
}: PageProps<"/debug/error">) {
  // Read the flag per request (runtime env), not once at build time.
  await connection();
  if (process.env.ENABLE_TEST_ERROR_PAGE !== "1") notFound();

  const { throw: throwWhere } = await searchParams;
  if (throwWhere === "server") {
    throw new Error(
      "Test Server Component error for test-user@example.com (E01-T07)",
    );
  }

  return (
    <main className="p-8">
      <h1>Error tracking test</h1>
      <ThrowInClient />
    </main>
  );
}
