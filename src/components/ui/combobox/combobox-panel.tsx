"use client";

import { Command } from "cmdk";
import { Check, LoaderCircle, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";
import { normalizeSearchText } from "@/lib/utils/normalize-search-text";

import { HighlightedText } from "./highlighted-text";
import { useActiveDescendantFix } from "./use-active-descendant-fix";
import { useComboboxSearch } from "./use-combobox-search";

import type { ComboboxPanelProps } from "./combobox.types";

/**
 * The searchable part of the Combobox, shown in the popover (desktop) or the
 * full-height sheet (phone): search input, results and the create option.
 * cmdk provides the ARIA combobox pattern (`role="combobox"` input with
 * `aria-activedescendant`, `listbox` / `option`s) and ↑ / ↓ / Home / End /
 * Enter; filtering is ours (async), so cmdk's own is off. Mounted only while
 * open, so the query starts empty every time.
 */
export function ComboboxPanel<T>({
  label,
  onSearch,
  getKey,
  getLabel,
  renderItem,
  initialItems,
  selectedKeys,
  searchPlaceholder,
  emptyText,
  errorText,
  onCreate,
  createLabel,
  onSelect,
  className,
}: ComboboxPanelProps<T>) {
  const translate = useTranslations("ui");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useActiveDescendantFix(inputRef, listRef);
  const { items, status } = useComboboxSearch({
    query,
    onSearch,
    initialItems,
  });
  const trimmedQuery = query.trim();
  const normalizedQuery = useMemo(() => normalizeSearchText(query), [query]);
  const isLoading = status === "loading";

  const hasExactMatch = useMemo(
    () =>
      items.some(
        (item) => normalizeSearchText(getLabel(item)) === normalizedQuery,
      ),
    [items, getLabel, normalizedQuery],
  );
  const isCreateVisible =
    onCreate !== null && normalizedQuery !== "" && !isLoading && !hasExactMatch;
  const isEmpty = status === "success" && items.length === 0;

  const announcement = useMemo(() => {
    if (isLoading) return translate("loading");
    if (status === "error") return errorText;
    if (items.length === 0) return status === "idle" ? "" : emptyText;
    return translate("comboboxResultCount", { count: items.length });
  }, [isLoading, status, items.length, errorText, emptyText, translate]);

  const createItem = () => {
    onCreate?.(trimmedQuery);
    setQuery("");
  };

  return (
    <Command
      label={label}
      shouldFilter={false}
      className={cn("flex min-h-0 flex-1 flex-col gap-2", className)}
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 rounded-lg bg-surface px-4 text-muted-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
        <Search aria-hidden="true" size={20} strokeWidth={1.5} />
        <Command.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder={searchPlaceholder ?? translate("comboboxSearch")}
          aria-busy={isLoading}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
        {isLoading && (
          <LoaderCircle
            aria-hidden="true"
            size={20}
            strokeWidth={1.5}
            className="shrink-0 animate-spin"
          />
        )}
      </div>

      <Command.List
        ref={listRef}
        label={label}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {items.map((item) => {
          const key = getKey(item);
          const isSelected = selectedKeys.has(key);
          return (
            <Command.Item
              key={key}
              value={`${OPTION_VALUE_PREFIX}${key}`}
              onSelect={() => onSelect(item)}
              aria-checked={isSelected}
              className="flex min-h-16 cursor-pointer items-center gap-3 border-b border-border px-3 py-2 text-base text-foreground transition-colors duration-150 ease-out data-[selected=true]:bg-primary-soft"
            >
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                {renderItem(item, {
                  highlightedLabel: (
                    <HighlightedText
                      text={getLabel(item)}
                      normalizedQuery={normalizedQuery}
                    />
                  ),
                  isSelected,
                })}
              </div>
              {isSelected && (
                <Check
                  aria-hidden="true"
                  size={20}
                  strokeWidth={1.5}
                  className="shrink-0 text-primary"
                />
              )}
            </Command.Item>
          );
        })}

        {isEmpty && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        )}
        {status === "error" && (
          <p className="px-3 py-6 text-center text-sm text-destructive">
            {errorText}
          </p>
        )}

        {isCreateVisible && (
          // Sticky at the bottom of the scrolling list, so it stays in view
          // (and in the ↑ / ↓ order, as the last option) however long the list.
          <Command.Item
            value={CREATE_OPTION_VALUE}
            onSelect={createItem}
            className="group sticky bottom-0 cursor-pointer bg-popover pt-3"
          >
            <span className="flex h-13 items-center justify-center gap-2 rounded-lg border border-dashed border-input px-4 text-base font-medium text-foreground transition-colors duration-150 ease-out group-data-[selected=true]:border-solid group-data-[selected=true]:bg-primary-soft">
              <Plus aria-hidden="true" size={20} strokeWidth={1.5} />
              <span className="truncate">{createLabel(trimmedQuery)}</span>
            </span>
          </Command.Item>
        )}
      </Command.List>

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </Command>
  );
}

// Option values are namespaced so an item key can never equal the create option's.
const OPTION_VALUE_PREFIX = "option:";
const CREATE_OPTION_VALUE = "create";
