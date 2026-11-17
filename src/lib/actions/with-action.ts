import "server-only";

import * as Sentry from "@sentry/nextjs";
import { unstable_rethrow } from "next/navigation";
import { type z } from "zod";

import { AppError, ErrorCode } from "@/lib/errors";
import { fail, ok, type Failure, type Result } from "@/lib/result";

/**
 * Postgres / PostgREST error codes that are expected outcomes, not bugs
 * (https://postgrest.org/en/stable/references/errors.html). They become a
 * failed `Result` and are not reported. Any other database error is UNKNOWN
 * and reported.
 */
const postgresErrorCodes: Record<string, ErrorCode> = {
  // insufficient_privilege: RLS denied the row (or no grant).
  "42501": ErrorCode.FORBIDDEN,
  // `.single()` matched no row (or more than one).
  PGRST116: ErrorCode.NOT_FOUND,
  // unique_violation
  "23505": ErrorCode.CONFLICT,
};

/**
 * Wraps a Server Action body (E01-T07; docs/architecture.md → Conventions):
 *
 * 1. validates the input with `schema` (zod); invalid input returns
 *    `{ ok: false, error: "VALIDATION", fields }` without calling `handler`;
 * 2. runs `handler` with the parsed input and returns `{ ok: true, data }`;
 * 3. turns expected failures into `{ ok: false, error }` — an `AppError`
 *    thrown by the handler, or a Supabase `PostgrestError` with a known code
 *    (see `postgresErrorCodes`) — without reporting them;
 * 4. reports anything else to error tracking and returns `UNKNOWN`, so no
 *    internal message reaches the client.
 *
 * Next.js control-flow errors (`redirect()`, `notFound()`, `forbidden()`,
 * dynamic-rendering bailouts) are rethrown, never turned into a `Result`.
 *
 * ```ts
 * "use server";
 * export const renameSession = withAction(
 *   z.object({ id: z.uuid(), name: z.string().trim().min(1) }),
 *   async ({ id, name }) => {
 *     const { error } = await supabase.from("sessions").update({ name }).eq("id", id);
 *     if (error) throw error; // 42501 → FORBIDDEN, others → UNKNOWN (reported)
 *   },
 * );
 * ```
 */
export function withAction<Schema extends z.ZodType, T>(
  schema: Schema,
  handler: (input: z.output<Schema>) => T | Promise<T>,
): (input: z.input<Schema>) => Promise<Result<Awaited<T>>> {
  return async (input) => {
    const parsed = await schema.safeParseAsync(input);
    if (!parsed.success) {
      return fail(ErrorCode.VALIDATION, fieldErrors(parsed.error));
    }

    try {
      return ok(await handler(parsed.data));
    } catch (error) {
      // redirect(), notFound() etc. work by throwing; let Next.js handle them.
      unstable_rethrow(error);

      const expected = toExpectedFailure(error);
      if (expected) return expected;

      Sentry.captureException(error);
      return fail(ErrorCode.UNKNOWN);
    }
  };
}

/**
 * `{ "sets.0.reps": "VALIDATION" }`: one entry per invalid field path (first
 * issue wins). Issues about the input as a whole (empty path) only set the
 * top-level `VALIDATION` code.
 */
export function fieldErrors(error: z.ZodError): Record<string, ErrorCode> {
  const fields: Record<string, ErrorCode> = {};
  for (const issue of error.issues) {
    if (issue.path.length === 0) continue;
    const path = issue.path.map(String).join(".");
    fields[path] ??= ErrorCode.VALIDATION;
  }
  return fields;
}

function toExpectedFailure(error: unknown): Failure | undefined {
  if (error instanceof AppError) return fail(error.code, error.fields);
  if (isPostgrestError(error)) {
    const code = postgresErrorCodes[error.code];
    if (code) return fail(code);
  }
  return undefined;
}

/**
 * Duck-typed `PostgrestError` (what supabase-js returns as `{ error }`): an
 * object with string `code`, `details` and `hint`-like fields.
 */
function isPostgrestError(
  error: unknown,
): error is { code: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { code?: unknown }).code === "string" &&
    "details" in error &&
    "hint" in error
  );
}
