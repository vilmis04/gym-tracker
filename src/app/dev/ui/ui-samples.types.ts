import { type SAMPLE_EXERCISES } from "./ui-samples";

/** A seeded sample, or one made with "Create “…”" in the demo. */
export type SampleExercise =
  | (typeof SAMPLE_EXERCISES)[number]
  | { id: string; name: string; machine: null };
