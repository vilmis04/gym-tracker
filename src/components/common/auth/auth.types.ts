import { type ReactNode } from "react";

import type { Locale } from "@/lib/i18n/i18n.types";

export interface AuthProviderProps {
  /** The URL's locale: Clerk's texts and its sign-in / sign-out URLs follow it. */
  locale: Locale;
  children: ReactNode;
}

/** The signed-in user as the avatar menu shows them. */
export interface AccountUser {
  /** Full name from Google; the email when Clerk has no name. */
  name: string;
  email: string | null;
  /** The Google profile picture; `null` shows the initials. */
  imageUrl: string | null;
}

/** What the avatar menu needs from the auth provider: who, and how to leave. */
export interface Account {
  user: AccountUser;
  /** Ends the Clerk session, then opens `redirectUrl`. */
  signOut: (redirectUrl: string) => Promise<void>;
}
