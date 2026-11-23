"use client";

import { useSignIn } from "@clerk/nextjs";
import * as Sentry from "@sentry/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { getHomePath, getSsoCallbackPath } from "@/lib/auth/auth-routes";

import type { GoogleSignInButtonProps } from "./auth.types";

/**
 * "Continue with Google" in one tap (E04-T05): starts Clerk's Google OAuth
 * flow directly, without the `<SignIn />` card in between. Google returns to
 * the sign-in route's SSO callback, which finishes the sign-in, or the
 * sign-up of a new user, and then opens Home. Rendered only where Clerk is
 * configured (inside `<ClerkProvider>`); `ContinueWithGoogle` links to the
 * sign-in page otherwise.
 *
 * Clerk's `sso()` waits until clerk-js has loaded, so the button works
 * right away and shows its spinner meanwhile. If the flow can't start, the
 * button is ready again and an alert below it says so.
 */
export function GoogleSignInButton({ className }: GoogleSignInButtonProps) {
  const { signIn } = useSignIn();
  const locale = useLocale();
  const translate = useTranslations("auth");
  const errorId = useId();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    // Back from Google's page restores this one from the back/forward
    // cache with the spinner still on; make the button usable again.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setIsRedirecting(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleFailure = (error: unknown) => {
    Sentry.captureException(error);
    setIsRedirecting(false);
    setHasFailed(true);
  };

  const startGoogleSignIn = async () => {
    setIsRedirecting(true);
    setHasFailed(false);
    try {
      const { error } = await signIn.sso({
        strategy: "oauth_google",
        redirectCallbackUrl: getSsoCallbackPath(locale),
        redirectUrl: getHomePath(locale),
      });
      // On success the browser is already leaving for Google.
      if (error) handleFailure(error);
    } catch (error) {
      handleFailure(error);
    }
  };

  return (
    <>
      <Button
        size="lg"
        className={className}
        isLoading={isRedirecting}
        loadingLabel={translate("openingGoogle")}
        aria-describedby={hasFailed ? errorId : undefined}
        onClick={startGoogleSignIn}
      >
        {translate("continueWithGoogle")}
      </Button>
      {hasFailed && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {translate("googleSignInFailed")}
        </p>
      )}
    </>
  );
}
