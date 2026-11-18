import { type ReactNode } from "react";

export interface ComboboxSearchOptions {
  /** Aborted when a newer query replaces this one or the list closes. */
  signal: AbortSignal;
}

/** Called 200 ms after the last keystroke with the trimmed, non-empty query. */
export type ComboboxSearch<T> = (
  query: string,
  options: ComboboxSearchOptions,
) => Promise<readonly T[]>;

export interface ComboboxItemRenderContext {
  /** The item's label as a `<span>`, the query's matches marked (accent-insensitive). */
  highlightedLabel: ReactNode;
  /** Whether the item is the current value (or one of them). */
  isSelected: boolean;
}

interface ComboboxBaseProps<T> {
  /**
   * What is picked ("Exercise", "Tags"): names the trigger, the search input
   * and the results list, and titles the full-height sheet on a phone.
   */
  label: string;
  onSearch: ComboboxSearch<T>;
  /** Stable, unique id of an item (e.g. its database id). */
  getKey: (item: T) => string;
  /** Text shown for an item; also what the query is matched against. */
  getLabel: (item: T) => string;
  /** Option content; defaults to the highlighted label. */
  renderItem?: (item: T, context: ComboboxItemRenderContext) => ReactNode;
  /** Shown before anything is typed (e.g. recently used). */
  initialItems?: readonly T[];
  /** Trigger text while nothing is selected. */
  placeholder?: string;
  /** Placeholder of the search input. */
  searchPlaceholder?: string;
  /** Shown (and announced) when a search returns nothing. */
  emptyText?: string;
  /** Shown (and announced) when `onSearch` rejects. */
  errorText?: string;
  disabled?: boolean;
  className?: string;
  /** Set by FormField: the trigger button's id, description and error state. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

interface ComboboxSingleProps<T> {
  multiple?: false;
  value: T | null;
  onChange: (value: T | null) => void;
}

interface ComboboxMultipleProps<T> {
  /** Picks several items, shown as removable chips; the list stays open. */
  multiple: true;
  value: readonly T[];
  onChange: (value: readonly T[]) => void;
}

interface ComboboxWithCreateProps {
  /**
   * Adds a "Create “{query}”" option at the bottom while no result's
   * normalized label equals the normalized query.
   */
  allowCreate: true;
  /** Called with the trimmed query; adding the new item is up to the owner. */
  onCreate: (query: string) => void;
  /** Text of the create option; defaults to `Create “{query}”`. */
  createLabel?: (query: string) => string;
}

interface ComboboxWithoutCreateProps {
  allowCreate?: false;
  onCreate?: never;
  createLabel?: never;
}

export type ComboboxProps<T> = ComboboxBaseProps<T> &
  (ComboboxSingleProps<T> | ComboboxMultipleProps<T>) &
  (ComboboxWithCreateProps | ComboboxWithoutCreateProps);

export interface ComboboxPanelProps<T> {
  label: string;
  onSearch: ComboboxSearch<T>;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  renderItem: (item: T, context: ComboboxItemRenderContext) => ReactNode;
  initialItems: readonly T[];
  selectedKeys: ReadonlySet<string>;
  searchPlaceholder?: string;
  emptyText: string;
  errorText: string;
  /** Present when creating is allowed. */
  onCreate: ((query: string) => void) | null;
  createLabel: (query: string) => string;
  onSelect: (item: T) => void;
  className?: string;
}

export type ComboboxSearchStatus = "idle" | "loading" | "success" | "error";

export interface ComboboxSearchState<T> {
  items: readonly T[];
  status: ComboboxSearchStatus;
}

/** The latest settled search, kept with the query it answers. */
export interface ComboboxSearchResponse<T> {
  query: string;
  items: readonly T[];
  isError: boolean;
}

export interface UseComboboxSearchOptions<T> {
  query: string;
  onSearch: ComboboxSearch<T>;
  initialItems: readonly T[];
}

export interface HighlightedTextProps {
  text: string;
  /** The query after `normalizeSearchText` (normalized once per list). */
  normalizedQuery: string;
}
