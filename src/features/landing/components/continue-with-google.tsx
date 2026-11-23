import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { GoogleSignInButton } from "@/components/common/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { getSignInPath } from "@/lib/auth/auth-routes";
import { isClerkConfigured } from "@/lib/auth/clerk-env";

/**
 * The landing page's one primary action (E04-T05). With Clerk it starts
 * Google sign-in in one tap (`GoogleSignInButton`). Without Clerk keys
 * (CI, a fresh checkout) it is a link to the sign-in page, which explains
 * that signing in isn't available, so the page never shows a dead button.
 */
export function ContinueWithGoogle() {
  const locale = useLocale();
  const translate = useTranslations("auth");

  if (isClerkConfigured()) {
    return <GoogleSignInButton className={BUTTON_CLASS_NAME} />;
  }
  return (
    <Button asChild size="lg" className={BUTTON_CLASS_NAME}>
      <Link href={getSignInPath(locale)}>
        {translate("continueWithGoogle")}
      </Link>
    </Button>
  );
}

// Full width in the column on phones (thumb reach), its own width from 640 px.
const BUTTON_CLASS_NAME = "w-full sm:w-auto sm:min-w-72";
