// Default accessible names for the base components' built-in controls; every
// component also takes its own label prop to override them.
// TODO(E03): translate via next-intl.
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
} as const;
