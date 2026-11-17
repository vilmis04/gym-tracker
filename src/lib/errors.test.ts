import { describe, expect, it } from "vitest";

import { AppError, ErrorCode, errorMessageKey, isErrorCode } from "./errors";

describe("ErrorCode", () => {
  it("has the codes the UI translates", () => {
    expect(Object.values(ErrorCode)).toEqual([
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "VALIDATION",
      "CONFLICT",
      "LOCKED",
      "UNKNOWN",
    ]);
  });

  it("maps every code to a distinct errors.* message key", () => {
    for (const code of Object.values(ErrorCode)) {
      expect(errorMessageKey[code]).toMatch(/^errors\.[a-zA-Z]+$/);
    }
    expect(Object.keys(errorMessageKey).sort()).toEqual(
      Object.values(ErrorCode).sort(),
    );
    expect(new Set(Object.values(errorMessageKey)).size).toBe(
      Object.values(ErrorCode).length,
    );
    // TODO(E03): also assert each key exists in messages/en.json and messages/lt.json.
  });

  it("recognises codes", () => {
    expect(isErrorCode("NOT_FOUND")).toBe(true);
    expect(isErrorCode("toString")).toBe(false);
    expect(isErrorCode(42)).toBe(false);
  });
});

describe("AppError", () => {
  it("carries a code and optional fields", () => {
    const error = new AppError("LOCKED", { fields: { reps: "LOCKED" } });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
    expect(error.code).toBe("LOCKED");
    expect(error.message).toBe("LOCKED");
    expect(error.fields).toEqual({ reps: "LOCKED" });
  });
});
