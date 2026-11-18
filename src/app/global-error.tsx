"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Last-resort error UI (replaces the root layout) for errors no closer
 * `error.tsx` handles; reports the error to error tracking (E01-T07).
 * Server-side errors are also reported on the server (`onRequestError`).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // TODO(E03): translate. next-intl's provider lives in the layout this
  // replaces, so this fallback copy is hard-coded until then.
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <main style={{ textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <button type="button" onClick={() => retry()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
