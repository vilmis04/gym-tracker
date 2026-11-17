// @vitest-environment node
import * as Sentry from "@sentry/nextjs";
import { notFound, redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { AppError } from "@/lib/errors";

import { withAction } from "./with-action";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const schema = z.object({
  name: z.string().trim().min(1),
  sets: z.array(z.object({ reps: z.number().int().positive() })).optional(),
});

describe("withAction()", () => {
  const handler = vi.fn(async ({ name }: { name: string }) => ({
    greeting: `hi ${name}`,
  }));

  beforeEach(() => {
    handler.mockImplementation(async ({ name }) => ({
      greeting: `hi ${name}`,
    }));
  });

  it("returns ok with the handler's data for valid input", async () => {
    const action = withAction(schema, handler);

    await expect(action({ name: "  Ana " })).resolves.toEqual({
      ok: true,
      data: { greeting: "hi Ana" },
    });
    // The handler receives the parsed (trimmed) input.
    expect(handler).toHaveBeenCalledWith({ name: "Ana" });
  });

  it("returns VALIDATION with field paths for invalid input, without calling the handler", async () => {
    const action = withAction(schema, handler);

    const result = await action({
      name: "",
      sets: [{ reps: 5 }, { reps: -1 }],
    });

    expect(result).toEqual({
      ok: false,
      error: "VALIDATION",
      fields: { name: "VALIDATION", "sets.1.reps": "VALIDATION" },
    });
    expect(handler).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("returns VALIDATION with no fields when the whole input is wrong", async () => {
    const action = withAction(schema, handler);

    await expect(action("nope" as never)).resolves.toEqual({
      ok: false,
      error: "VALIDATION",
      fields: {},
    });
  });

  it("returns an AppError's code (and fields) without reporting it", async () => {
    handler.mockRejectedValue(
      new AppError("LOCKED", { fields: { name: "LOCKED" } }),
    );
    const action = withAction(schema, handler);

    await expect(action({ name: "Ana" })).resolves.toEqual({
      ok: false,
      error: "LOCKED",
      fields: { name: "LOCKED" },
    });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it.each([
    ["42501", "FORBIDDEN"],
    ["PGRST116", "NOT_FOUND"],
    ["23505", "CONFLICT"],
  ])(
    "maps PostgrestError %s to %s without reporting it",
    async (code, expected) => {
      handler.mockRejectedValue(postgrestError(code));
      const action = withAction(schema, handler);

      await expect(action({ name: "Ana" })).resolves.toEqual({
        ok: false,
        error: expected,
      });
      expect(Sentry.captureException).not.toHaveBeenCalled();
    },
  );

  it("reports an unknown database error and returns UNKNOWN", async () => {
    const error = postgrestError("08006");
    handler.mockRejectedValue(error);
    const action = withAction(schema, handler);

    await expect(action({ name: "Ana" })).resolves.toEqual({
      ok: false,
      error: "UNKNOWN",
    });
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it("reports unexpected errors and returns UNKNOWN without their message", async () => {
    const error = new Error("database password is hunter2");
    handler.mockRejectedValue(error);
    const action = withAction(schema, handler);

    const result = await action({ name: "Ana" });

    expect(result).toEqual({ ok: false, error: "UNKNOWN" });
    expect(JSON.stringify(result)).not.toContain("hunter2");
    expect(Sentry.captureException).toHaveBeenCalledExactlyOnceWith(error);
  });

  it("rethrows redirect() and notFound() for Next.js to handle", async () => {
    handler.mockImplementationOnce(async () => redirect("/en/sessions"));
    const action = withAction(schema, handler);
    await expect(action({ name: "Ana" })).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });

    handler.mockImplementationOnce(async () => notFound());
    await expect(action({ name: "Ana" })).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK;404"),
    });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("supports async refinements", async () => {
    const taken = z
      .object({ name: z.string() })
      .refine(async ({ name }) => name !== "taken", {
        path: ["name"],
      });
    const action = withAction(taken, async ({ name }) => name);

    await expect(action({ name: "taken" })).resolves.toEqual({
      ok: false,
      error: "VALIDATION",
      fields: { name: "VALIDATION" },
    });
    await expect(action({ name: "free" })).resolves.toEqual({
      ok: true,
      data: "free",
    });
  });
});

/** Shape of supabase-js's PostgrestError. */
function postgrestError(code: string) {
  return Object.assign(new Error(`postgres error ${code}`), {
    name: "PostgrestError",
    code,
    details: "",
    hint: "",
  });
}
