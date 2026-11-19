export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  /** Full name: the accessible name, the initials and the fill color come from it. */
  name: string;
  /** Profile picture; the initials show while it loads or when it fails. */
  imageUrl?: string | null;
  /** `sm` 26 px (chips, stacks), `md` 40 px (lists), `lg` 44 px (header button). */
  size?: AvatarSize;
  /** Hide from screen readers when the name is already written next to it. */
  isDecorative?: boolean;
  className?: string;
}

export interface AvatarStackPerson {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export interface AvatarStackProps {
  people: readonly AvatarStackPerson[];
  /** Accessible name of the list, e.g. "Participants". */
  label: string;
  /** Avatars shown before the "+N" counter. */
  maxVisible?: number;
  size?: AvatarSize;
  /** Screen-reader text of the "+N" counter; defaults to "and N more" (`ui.hiddenAvatars`). */
  getHiddenCountLabel?: (hiddenCount: number) => string;
  /**
   * Set `[--avatar-ring:var(--color-card)]` (or another fill) when the stack
   * sits on something other than the page background: the ring that
   * separates overlapping avatars is painted in that color.
   */
  className?: string;
}
