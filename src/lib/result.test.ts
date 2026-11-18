import { describe, expect, expectTypeOf, it } from "vitest";

import { fail, ok, type Result } from "./result";

describe("Result helpers", () => {
  it("ok() wraps data", () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
    expect(ok()).toEqual({ ok: true, data: undefined });
  });

  it("fail() carries a code and optional fields", () => {
    expect(fail("NOT_FOUND")).toEqual({ ok: false, error: "NOT_FOUND" });
    expect(fail("NOT_FOUND")).not.toHaveProperty("fields");
    expect(fail("VALIDATION", { name: "VALIDATION" })).toEqual({
      ok: false,
      error: "VALIDATION",
      fields: { name: "VALIDATION" },
    });
  });

  it("narrows on ok", () => {
    const result = ok(5) as Result<number>;
    if (result.ok) expectTypeOf(result.data).toEqualTypeOf<number>();
    else
      expectTypeOf(result.error).toEqualTypeOf<
        | "UNAUTHORIZED"
        | "FORBIDDEN"
        | "NOT_FOUND"
        | "VALIDATION"
        | "CONFLICT"
        | "LOCKED"
        | "UNKNOWN"
      >();
  });
});
