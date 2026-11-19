"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { Chip } from "../chip";
import { FOCUS_RING_CLASS_NAME } from "../focus-ring";
import { FIELD_CLASS_NAME } from "../input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "../popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../sheet";
import { useMediaQuery } from "../use-media-query";
import { ComboboxPanel } from "./combobox-panel";

import type {
  ComboboxItemRenderContext,
  ComboboxProps,
} from "./combobox.types";

/**
 * Searchable picker (E02-T04) for exercises, machines, tags and buddies: a
 * field-like trigger that opens a search with async results, an optional
 * "Create “…”" option and, with `multiple`, removable chips in the field.
 * Opens in a popover from 1024 px and as a full-height sheet below (input
 * focused, results above the on-screen keyboard). Works inside FormField.
 *
 * ```tsx
 * <FormField label="Machine">
 *   <Combobox
 *     label="Machine"
 *     onSearch={(query, { signal }) => searchMachines(query, { signal })}
 *     getKey={(machine) => machine.id}
 *     getLabel={(machine) => machine.name}
 *     value={machine}
 *     onChange={setMachine}
 *     allowCreate
 *     onCreate={createMachine}
 *   />
 * </FormField>
 * ```
 */
export function Combobox<T>({
  label,
  onSearch,
  getKey,
  getLabel,
  renderItem = renderHighlightedLabel,
  initialItems = NO_INITIAL_ITEMS,
  placeholder,
  searchPlaceholder,
  emptyText,
  errorText,
  disabled = false,
  className,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": isInvalid,
  multiple,
  value,
  onChange,
  allowCreate,
  onCreate,
  createLabel,
}: ComboboxProps<T>) {
  const translate = useTranslations("ui");
  const createDefaultLabel = (query: string) =>
    translate("comboboxCreate", { query });
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chipListRef = useRef<HTMLUListElement>(null);
  const labelId = useId();
  const valueId = useId();

  const selectedItems = useMemo((): readonly T[] => {
    if (multiple) return value;
    return value === null ? [] : [value];
  }, [multiple, value]);
  const selectedKeys = useMemo(
    () => new Set(selectedItems.map(getKey)),
    [selectedItems, getKey],
  );

  const selectItem = (item: T) => {
    if (!multiple) {
      onChange(item);
      setIsOpen(false);
      return;
    }
    const key = getKey(item);
    onChange(
      selectedKeys.has(key)
        ? value.filter((selectedItem) => getKey(selectedItem) !== key)
        : [...value, item],
    );
  };

  const createItem = (query: string) => {
    onCreate?.(query);
    if (!multiple) setIsOpen(false);
  };

  const removeItem = (index: number) => {
    if (!multiple) return;
    // The removed chip's button unmounts: move focus to the next chip, else
    // the previous one, else the trigger, before it goes.
    const removeButtons = Array.from(
      chipListRef.current?.querySelectorAll("button") ?? [],
    );
    const nextFocus =
      removeButtons[index + 1] ??
      removeButtons[index - 1] ??
      triggerRef.current;
    nextFocus?.focus();
    onChange(value.filter((_selectedItem, i) => i !== index));
  };

  const Trigger = isDesktop ? PopoverTrigger : SheetTrigger;
  const singleItem = multiple ? null : value;
  const triggerText = singleItem === null ? placeholder : getLabel(singleItem);

  const triggerButton = (
    <Trigger asChild>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-describedby={describedBy}
        // A button can't be aria-invalid; the error is in its description.
        data-invalid={isInvalid || undefined}
        className={cn(
          "flex cursor-pointer items-center justify-between gap-2 text-left",
          multiple
            ? cn(
                "min-h-11 min-w-32 flex-1 rounded-md px-2 text-base text-muted-foreground disabled:cursor-not-allowed",
                FOCUS_RING_CLASS_NAME,
              )
            : cn(FIELD_CLASS_NAME, "h-14 px-4", INVALID_CLASS_NAME, className),
        )}
      >
        <span id={labelId} hidden>
          {label}
        </span>
        <span
          id={valueId}
          className={cn(
            "truncate",
            singleItem === null && "text-muted-foreground",
          )}
        >
          {triggerText}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={20}
          strokeWidth={1.5}
          className="shrink-0 text-muted-foreground"
        />
      </button>
    </Trigger>
  );

  const field = multiple ? (
    <div
      className={cn(
        "flex min-h-14 w-full flex-wrap items-center gap-2 rounded-lg bg-surface p-2",
        "has-data-invalid:ring-2 has-data-invalid:ring-destructive",
        disabled && "opacity-50",
        className,
      )}
    >
      {selectedItems.length > 0 && (
        <ul
          ref={chipListRef}
          aria-label={label}
          className="flex max-w-full flex-wrap gap-2"
        >
          {selectedItems.map((item, index) => (
            <li key={getKey(item)} className="max-w-full">
              <Chip
                label={getLabel(item)}
                onRemove={disabled ? undefined : () => removeItem(index)}
              />
            </li>
          ))}
        </ul>
      )}
      {triggerButton}
    </div>
  ) : (
    triggerButton
  );

  const panel = (
    <ComboboxPanel
      label={label}
      onSearch={onSearch}
      getKey={getKey}
      getLabel={getLabel}
      renderItem={renderItem}
      initialItems={initialItems}
      selectedKeys={selectedKeys}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText ?? translate("comboboxNoResults")}
      errorText={errorText ?? translate("comboboxSearchFailed")}
      onCreate={allowCreate ? createItem : null}
      createLabel={createLabel ?? createDefaultLabel}
      onSelect={selectItem}
    />
  );

  if (isDesktop) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {multiple ? <PopoverAnchor asChild>{field}</PopoverAnchor> : field}
        <PopoverContent
          align="start"
          className="flex max-h-[min(26rem,var(--radix-popper-available-height))] w-(--radix-popover-trigger-width) min-w-72 flex-col overflow-hidden p-2"
        >
          {panel}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {field}
      <SheetContent
        size="full"
        aria-describedby={undefined}
        className="gap-3 overflow-hidden"
      >
        <SheetHeader className="min-h-11 justify-center">
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        {panel}
      </SheetContent>
    </Sheet>
  );
}

// Same breakpoint as the Sheet's switch to a side panel (Tailwind `lg`).
const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

const INVALID_CLASS_NAME = "data-invalid:ring-2 data-invalid:ring-destructive";

const NO_INITIAL_ITEMS: readonly never[] = [];

const renderHighlightedLabel = (
  _item: unknown,
  { highlightedLabel }: ComboboxItemRenderContext,
) => highlightedLabel;
