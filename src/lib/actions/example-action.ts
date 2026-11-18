"use server";

import { z } from "zod";

import { withAction } from "./with-action";

/**
 * Example Server Action showing the `withAction()` pattern (E01-T07). Not
 * used by any page; replace with real actions (E05) and delete.
 */
export const logExampleSet = withAction(
  z.object({
    exercise: z.string().trim().min(1).max(100),
    reps: z.number().int().min(1).max(1000),
    weightKg: z.number().min(0).max(1000).optional(),
  }),
  async ({ exercise, reps, weightKg }) => ({
    exercise,
    reps,
    weightKg: weightKg ?? null,
  }),
);
