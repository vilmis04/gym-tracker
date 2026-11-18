import { type ErrorCode } from "./errors";

/**
 * What every Server Action returns (E01-T07; docs/architecture.md →
 * Conventions). Failures carry an `ErrorCode`, never a message: the UI
 * translates it via `errorMessageKey`. `fields` maps a field path
 * (`"sets.0.reps"`) to the code for that field.
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode; fields?: Record<string, ErrorCode> };

export type Failure = Extract<Result<never>, { ok: false }>;

export function ok(): Result<void>;
export function ok<T>(data: T): Result<T>;
export function ok<T>(data?: T): Result<T | undefined> {
  return { ok: true, data };
}

export function fail(
  error: ErrorCode,
  fields?: Record<string, ErrorCode>,
): Failure {
  return fields ? { ok: false, error, fields } : { ok: false, error };
}
