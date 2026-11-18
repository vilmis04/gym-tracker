// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { logExampleSet } from "./example-action";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

describe("logExampleSet (example withAction() Server Action)", () => {
  it("returns { ok: false, error: 'VALIDATION', fields } for invalid input", async () => {
    const result = await logExampleSet({
      exercise: " ",
      reps: 0,
      weightKg: -5,
    });

    expect(result).toEqual({
      ok: false,
      error: "VALIDATION",
      fields: {
        exercise: "VALIDATION",
        reps: "VALIDATION",
        weightKg: "VALIDATION",
      },
    });
  });

  it("returns the parsed data for valid input", async () => {
    await expect(
      logExampleSet({ exercise: " Squat ", reps: 5 }),
    ).resolves.toEqual({
      ok: true,
      data: { exercise: "Squat", reps: 5, weightKg: null },
    });
  });
});
