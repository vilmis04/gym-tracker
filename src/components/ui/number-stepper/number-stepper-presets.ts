/**
 * The app's two steppers (E02-T05), matching the `sets` columns
 * (docs/data-model.md: `weight_kg numeric(6,2) ≥ 0`, `reps int 1..999`):
 *
 * ```tsx
 * <NumberStepper {...NUMBER_STEPPER_PRESETS.weight} label="Weight" value={weight} onChange={setWeight} />
 * ```
 */
export const NUMBER_STEPPER_PRESETS = {
  weight: { step: 2.5, min: 0, max: 999.75, decimals: 2, unit: "kg" },
  reps: { step: 1, min: 1, max: 999, decimals: 0 },
} as const;
