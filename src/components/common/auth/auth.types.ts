import { type ReactNode } from "react";

import type { Locale } from "@/lib/i18n/i18n.types";
import type { AccessTokenProvider } from "@/lib/supabase/types";

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

/**
 * What app components need from the auth provider: who, how to leave or
 * manage the account, and the token that identifies them to Supabase.
 */
export interface Account {
  user: AccountUser;
  /** Ends the Clerk session, then opens `redirectUrl`. */
  signOut: (redirectUrl: string) => Promise<void>;
  /**
   * Opens Clerk's account management (E04-T04) in a dialog: the connected
   * Google account, signed-in devices.
   */
  openAccountManagement: () => void;
  /**
   * The current Clerk session token for Supabase (E04-T02), `null` once
   * signed out. Use it through `useSupabaseBrowserClient()`.
   */
  getToken: AccessTokenProvider;
}
