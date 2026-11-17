import { createServer, type Server } from "node:http";
import { promisify } from "node:util";
import { gunzip } from "node:zlib";

/**
 * A stand-in for Sentry's ingest API (E01-T07): accepts the envelopes the SDK
 * POSTs to `/api/<project>/envelope/` and keeps them in memory, so e2e tests
 * can check what would have been sent, without a Sentry account.
 *
 * Point the app at it with `NEXT_PUBLIC_SENTRY_DSN=http://public@127.0.0.1:<port>/1`.
 */

export type SentryEvent = {
  event_id?: string;
  platform?: string;
  release?: string;
  environment?: string;
  sdk?: { name?: string };
  user?: Record<string, unknown>;
  exception?: {
    values?: {
      type?: string;
      value?: string;
      stacktrace?: {
        frames?: { filename?: string; function?: string; lineno?: number }[];
      };
    }[];
  };
};

export type FakeSentry = {
  /** Every envelope body received, as text (for "contains no PII" checks). */
  readonly envelopes: string[];
  /** `event` items from all envelopes. */
  readonly events: SentryEvent[];
  close(): Promise<void>;
};

const gunzipAsync = promisify(gunzip);

/** `http://public@127.0.0.1:8999/1` → 8999; undefined for any other DSN. */
export function fakeSentryPort(dsn: string | undefined): number | undefined {
  const match = dsn?.match(/^http:\/\/[^@/]+@127\.0\.0\.1:(\d+)\/\d+$/);
  return match ? Number(match[1]) : undefined;
}

export async function startFakeSentry(port: number): Promise<FakeSentry> {
  const envelopes: string[] = [];
  const events: SentryEvent[] = [];

  const server: Server = createServer((request, response) => {
    // The browser SDK posts cross-origin (app on :3000, ingest on :port).
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "*");
    if (request.method !== "POST") {
      response.writeHead(204).end();
      return;
    }
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      void (async () => {
        let body = Buffer.concat(chunks);
        if (request.headers["content-encoding"] === "gzip")
          body = await gunzipAsync(body);
        const text = body.toString("utf8");
        envelopes.push(text);
        events.push(...parseEvents(text));
        response
          .writeHead(200, { "Content-Type": "application/json" })
          .end("{}");
      })();
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  return {
    envelopes,
    events,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

/**
 * Envelope format: a header line, then (item header line, payload line)
 * pairs. https://develop.sentry.dev/sdk/data-model/envelopes/
 */
function parseEvents(envelope: string): SentryEvent[] {
  const lines = envelope.split("\n");
  const events: SentryEvent[] = [];
  for (let i = 1; i < lines.length - 1; i += 2) {
    const header = safeParse(lines[i]) as
      { type?: string; length?: number } | undefined;
    if (header?.type === "event") {
      const event = safeParse(lines[i + 1]);
      if (event) events.push(event as SentryEvent);
    }
  }
  return events;
}

function safeParse(line: string | undefined): unknown {
  try {
    return line ? JSON.parse(line) : undefined;
  } catch {
    return undefined;
  }
}
