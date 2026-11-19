// Default accessible names for the base components' built-in controls; every
// component also takes its own label prop to override them.
// TODO(E03-T03): translate via next-intl, together with the ICU plurals the
// counts need ("1 result" / "2 results"; LT one / few / many / other).
export const UI_LABELS = {
  close: "Close",
  loading: "Loading",
  remove: (itemLabel: string) => `Remove ${itemLabel}`,
  hiddenAvatars: (hiddenCount: number) => `and ${hiddenCount} more`,
  comboboxCreate: (query: string) => `Create “${query}”`,
  comboboxResultCount: (resultCount: number) =>
    resultCount === 1 ? "1 result" : `${resultCount} results`,
  comboboxNoResults: "No results",
  comboboxSearchFailed: "Couldn’t load results. Try again.",
  comboboxSearch: "Search",
  numberStepperDecrease: (stepText: string) => `Decrease by ${stepText}`,
  numberStepperIncrease: (stepText: string) => `Increase by ${stepText}`,
} as const;
