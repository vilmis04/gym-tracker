/**
 * Error codes shared by Server Actions and the UI (E01-T07).
 *
 * A Server Action never returns raw error messages: it returns one of these
 * codes (see `Result` in `./result.ts`) and the UI shows the translated text
 * for `errorMessageKey[code]`. A const object + union type instead of a TS
 * `enum`: plain strings at runtime, serialisable across the Server Action
 * boundary, and usable as literal types (`error: "VALIDATION"`).
 */
export const ErrorCode = {
  /** Not signed in. */
  UNAUTHORIZED: "UNAUTHORIZED",
  /** Signed in, but not allowed (e.g. RLS denied the write). */
  FORBIDDEN: "FORBIDDEN",
  /** The record doesn't exist or isn't visible to the user. */
  NOT_FOUND: "NOT_FOUND",
  /** The input failed validation; `fields` says which fields. */
  VALIDATION: "VALIDATION",
  /** The record already exists (unique constraint). */
  CONFLICT: "CONFLICT",
  /** The record can no longer be changed (e.g. a locked session). */
  LOCKED: "LOCKED",
  /** Anything unexpected; reported to error tracking. */
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** next-intl message key (`messages/<locale>.json` → `errors.*`) per code. */
export type ErrorMessageKey = `errors.${string}`;

export const errorMessageKey = {
  UNAUTHORIZED: "errors.unauthorized",
  FORBIDDEN: "errors.forbidden",
  NOT_FOUND: "errors.notFound",
  VALIDATION: "errors.validation",
  CONFLICT: "errors.conflict",
  LOCKED: "errors.locked",
  UNKNOWN: "errors.unknown",
} as const satisfies Record<ErrorCode, ErrorMessageKey>;

/**
 * An expected failure with a known code, thrown from inside `withAction()`
 * handlers (e.g. `throw new AppError("NOT_FOUND")`). It becomes
 * `{ ok: false, error: code, fields }` and is **not** reported to error
 * tracking, unlike any other thrown error.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fields?: Record<string, ErrorCode>;

  constructor(
    code: ErrorCode,
    options?: {
      message?: string;
      fields?: Record<string, ErrorCode>;
      cause?: unknown;
    },
  ) {
    super(options?.message ?? code, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.fields = options?.fields;
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && Object.hasOwn(ErrorCode, value);
}
