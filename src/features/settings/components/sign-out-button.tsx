"use client";

import { LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useAccount } from "@/components/common/auth/account-context";
import { Button } from "@/components/ui/button";
import { getLandingPath } from "@/lib/auth/auth-routes";

/**
 * Sign out at the end of the settings page (E04-T04), like the avatar
 * menu's: ends the Clerk session and opens the landing page in the current
 * language. Disabled until Clerk has loaded the user.
 */
export function SignOutButton() {
  const translate = useTranslations("auth");
  const locale = useLocale();
  const account = useAccount();

  return (
    <Button
      variant="secondary"
      size="lg"
      disabled={account === null}
      onClick={() => void account?.signOut(getLandingPath(locale))}
      className="w-full sm:w-fit"
    >
      <LogOut aria-hidden="true" size={20} strokeWidth={1.5} />
      {translate("signOut")}
    </Button>
  );
}
