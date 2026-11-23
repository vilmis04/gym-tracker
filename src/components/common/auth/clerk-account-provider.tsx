"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { type ReactNode, useMemo } from "react";

import { AccountContext } from "./account-context";

import type { Account } from "./auth.types";

/**
 * Puts the Clerk user into `AccountContext` (E04-T01). Rendered inside
 * `<ClerkProvider>` by `AuthProvider`, so only when Clerk is configured.
 */
export function ClerkAccountProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const clerk = useClerk();

  const account = useMemo((): Account | null => {
    if (!user) return null;
    const email = user.primaryEmailAddress?.emailAddress ?? null;
    return {
      user: {
        name: user.fullName ?? email ?? "",
        email,
        // Without a photo Clerk returns a generated placeholder image; the
        // initials on a pastel fill match the rest of the app instead.
        imageUrl: user.hasImage ? user.imageUrl : null,
      },
      signOut: (redirectUrl) => clerk.signOut({ redirectUrl }),
    };
  }, [user, clerk]);

  return <AccountContext value={account}>{children}</AccountContext>;
}
