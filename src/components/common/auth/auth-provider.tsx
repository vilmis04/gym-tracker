import { ClerkProvider } from "@clerk/nextjs";

import { getAppPath } from "@/components/common/app-shell/nav-items";
import { getLandingPath, getSignInPath } from "@/lib/auth/auth-routes";
import { CLERK_APPEARANCE } from "@/lib/auth/clerk-appearance";
import { isClerkConfigured } from "@/lib/auth/clerk-env";
import { CLERK_LOCALIZATIONS } from "@/lib/auth/clerk-localizations";

import { ClerkAccountProvider } from "./clerk-account-provider";

import type { AuthProviderProps } from "./auth.types";

/**
 * Clerk for every localized page (E04-T01), in the `[locale]` root layout:
 * texts in the URL's language and the design tokens. Switching language
 * changes `locale`, and Clerk updates its mounted components in place.
 *
 * - Sign-in and sign-up are one Google-only flow on `/{locale}/sign-in`.
 * - After signing in: the `redirect_url` the proxy added (the page the user
 *   wanted), else Home. After signing out: the landing page.
 *
 * `ClerkAccountProvider` hands the signed-in user to app components
 * (`useAccount()`). Without Clerk keys (CI, a fresh checkout) it renders
 * `children` only (no account); the proxy then keeps every protected page
 * out of reach (`isClerkConfigured`).
 */
export function AuthProvider({ locale, children }: AuthProviderProps) {
  if (!isClerkConfigured()) return children;

  const signInPath = getSignInPath(locale);
  const homePath = getAppPath(locale, "dashboard");

  return (
    <ClerkProvider
      localization={CLERK_LOCALIZATIONS[locale]}
      appearance={CLERK_APPEARANCE}
      signInUrl={signInPath}
      signUpUrl={signInPath}
      signInFallbackRedirectUrl={homePath}
      signUpFallbackRedirectUrl={homePath}
      afterSignOutUrl={getLandingPath(locale)}
    >
      <ClerkAccountProvider>{children}</ClerkAccountProvider>
    </ClerkProvider>
  );
}
