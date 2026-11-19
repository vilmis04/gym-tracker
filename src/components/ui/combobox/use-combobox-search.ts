"use client";

import { useEffect, useEffectEvent, useState } from "react";

import type {
  ComboboxSearchResponse,
  ComboboxSearchState,
  UseComboboxSearchOptions,
} from "./combobox.types";

export const SEARCH_DEBOUNCE_MS = 200;

/**
 * Debounced, cancellable search: `onSearch` runs 200 ms after the query last
 * changed, the previous request's signal is aborted, and only the response
 * for the current query is ever returned (a slow answer to an older query
 * can't overwrite a newer one). While waiting, no items are returned, so
 * results and the create option never belong to an older query. An empty
 * query shows `initialItems` without searching.
 */
export function useComboboxSearch<T>({
  query,
  onSearch,
  initialItems,
}: UseComboboxSearchOptions<T>): ComboboxSearchState<T> {
  const trimmedQuery = query.trim();
  const [response, setResponse] = useState<ComboboxSearchResponse<T> | null>(
    null,
  );

  const search = useEffectEvent((searchQuery: string, signal: AbortSignal) =>
    onSearch(searchQuery, { signal }),
  );

  useEffect(() => {
    if (trimmedQuery === "") return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      search(trimmedQuery, controller.signal).then(
        (items) => {
          if (controller.signal.aborted) return;
          setResponse({ query: trimmedQuery, items, isError: false });
        },
        () => {
          if (controller.signal.aborted) return;
          setResponse({ query: trimmedQuery, items: [], isError: true });
        },
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [trimmedQuery]);

  if (trimmedQuery === "") return { items: initialItems, status: "idle" };
  if (response?.query !== trimmedQuery)
    return { items: NO_ITEMS, status: "loading" };
  return {
    items: response.items,
    status: response.isError ? "error" : "success",
  };
}

// One shared empty list, so memos keyed on `items` don't rerun while loading.
const NO_ITEMS: readonly never[] = [];
