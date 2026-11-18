"use client";

import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn } from "@/lib/utils/cn";

import type { AvatarProps, AvatarSize } from "./avatar.types";

/**
 * Round avatar (E02-T03): the profile picture, or the initials on one of the
 * five pastel fills (`--avatar-1..5`, the same in both themes), picked from
 * the name so a person keeps their color everywhere.
 */
export function Avatar({
  name,
  imageUrl = null,
  size = "md",
  isDecorative = false,
  className,
}: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      role={isDecorative ? undefined : "img"}
      aria-label={isDecorative ? undefined : name}
      aria-hidden={isDecorative || undefined}
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full select-none",
        SIZE_CLASS_NAMES[size],
        className,
      )}
    >
      {imageUrl !== null && (
        <AvatarPrimitive.Image
          src={imageUrl}
          alt=""
          className="size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className={cn(
          "flex size-full items-center justify-center font-semibold text-avatar-foreground",
          getAvatarFillClassName(name),
        )}
      >
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/** Up to two initials: first letters of the first and last word ("Rūta Žemaitė" → "RŽ"). */
export function getInitials(name: string): string {
  const words = name.trim().split(WHITESPACE_REGEX).filter(Boolean);
  const firstWord = words[0] ?? "";
  const lastWord = words.length > 1 ? (words.at(-1) ?? "") : "";
  return [firstWord, lastWord]
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

/** The same name always gets the same of the five fills. */
export function getAvatarFillClassName(name: string): string {
  const hash = Array.from(name).reduce(
    (sum, character) =>
      (sum * 31 + (character.codePointAt(0) ?? 0)) % 1_000_003,
    0,
  );
  return AVATAR_FILL_CLASS_NAMES[hash % AVATAR_FILL_CLASS_NAMES.length] ?? "";
}

// One or more whitespace characters, e.g. " " or "\t\n".
const WHITESPACE_REGEX = /\s+/;

// Full class names, so Tailwind generates them.
const AVATAR_FILL_CLASS_NAMES = [
  "bg-avatar-1",
  "bg-avatar-2",
  "bg-avatar-3",
  "bg-avatar-4",
  "bg-avatar-5",
] as const;

const SIZE_CLASS_NAMES: Record<AvatarSize, string> = {
  sm: "size-6.5 text-xs",
  md: "size-10 text-base",
  lg: "size-11 text-base",
};
