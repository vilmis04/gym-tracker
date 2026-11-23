/** The read-only account details the settings page shows (from `profiles`). */
export interface AccountCardProps {
  name: string;
  email: string;
  /** The Google photo; `null` shows the initials. */
  avatarUrl: string | null;
}
