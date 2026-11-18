"use client";

import { X } from "lucide-react";
import { type KeyboardEvent } from "react";

import { cn } from "@/lib/utils/cn";

import { FOCUS_RING_CLASS_NAME } from "./focus-ring";
import { UI_LABELS } from "./ui-labels";

import type { ChipProps } from "./chip.types";

/**
 * Chip (E02-T03) for tags and participants, as on the mock-ups' "New
 * exercise" form: 40 px pill on `bg-primary-soft`, optionally removable.
 * The × is 32 px but its hit area is padded to 44 × 44 px.
 */
export function Chip({
  label,
  icon,
  onRemove,
  removeLabel = UI_LABELS.remove(label),
  className,
}: ChipProps) {
  const handleRemoveKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onRemove?.();
    }
  };

  return (
    <span
      className={cn(
        "inline-flex h-10 max-w-full items-center gap-1.5 rounded-full bg-primary-soft text-sm text-foreground",
        icon ? "pl-1.5" : "pl-3.5",
        onRemove ? "pr-1" : "pr-3.5",
        className,
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          onKeyDown={handleRemoveKeyDown}
          className={cn(
            "relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-out after:absolute after:-inset-1.5 after:content-[''] hover:bg-background/60 hover:text-foreground",
            FOCUS_RING_CLASS_NAME,
            "focus-visible:outline-offset-0",
          )}
        >
          <X aria-hidden="true" size={16} strokeWidth={1.5} />
        </button>
      )}
    </span>
  );
}
