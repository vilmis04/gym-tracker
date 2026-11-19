import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils/cn";

import { Avatar } from "./avatar";

import type { AvatarSize, AvatarStackProps } from "./avatar.types";

/**
 * Overlapping avatars with a "+N" counter (E02-T03), e.g. the participants
 * on a session card. A labelled list, so screen readers read every visible
 * name and the hidden count.
 */
export function AvatarStack({
  people,
  label,
  maxVisible = 3,
  size = "sm",
  getHiddenCountLabel,
  className,
}: AvatarStackProps) {
  const translate = useTranslations("ui");
  const visiblePeople = people.slice(0, maxVisible);
  const hiddenCount = people.length - visiblePeople.length;
  const ringClassName = "ring-2 ring-(color:--avatar-ring)";

  return (
    <ul
      aria-label={label}
      className={cn(
        "flex items-center -space-x-1.5 [--avatar-ring:var(--color-background)]",
        className,
      )}
    >
      {visiblePeople.map((person) => (
        <li key={person.id} className="flex">
          <Avatar
            name={person.name}
            imageUrl={person.imageUrl}
            size={size}
            className={ringClassName}
          />
        </li>
      ))}
      {hiddenCount > 0 && (
        <li
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground tabular-nums",
            COUNTER_SIZE_CLASS_NAMES[size],
            ringClassName,
          )}
        >
          <span aria-hidden="true">+{hiddenCount}</span>
          <span className="sr-only">
            {getHiddenCountLabel?.(hiddenCount) ??
              translate("hiddenAvatars", { count: hiddenCount })}
          </span>
        </li>
      )}
    </ul>
  );
}

const COUNTER_SIZE_CLASS_NAMES: Record<AvatarSize, string> = {
  sm: "h-6.5 min-w-6.5 px-1 text-xs",
  md: "h-10 min-w-10 px-1.5 text-sm",
  lg: "h-11 min-w-11 px-2 text-sm",
};
