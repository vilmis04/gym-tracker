import { describe, expect, it } from "vitest";

import { AppError, ErrorCode, errorMessageKey, isErrorCode } from "./errors";
import { MESSAGES } from "./i18n/messages";

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
  });

  it("has a message for every key in both languages", () => {
    for (const messages of Object.values(MESSAGES)) {
      for (const messageKey of Object.values(errorMessageKey)) {
        const key = messageKey.replace("errors.", "");
        expect(Object.hasOwn(messages.errors, key)).toBe(true);
      }
    }
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
