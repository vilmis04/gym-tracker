"use client";

import { UserCog } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAccount } from "@/components/common/auth/account-context";
import { Button } from "@/components/ui/button";

/** Opens Clerk's account management dialog; disabled until Clerk has loaded. */
export function ManageAccountButton() {
  const translate = useTranslations("settings");
  const account = useAccount();

  return (
    <Button
      variant="secondary"
      disabled={account === null}
      onClick={() => account?.openAccountManagement()}
    >
      <UserCog aria-hidden="true" size={20} strokeWidth={1.5} />
      {translate("manageAccount")}
    </Button>
  );
}
