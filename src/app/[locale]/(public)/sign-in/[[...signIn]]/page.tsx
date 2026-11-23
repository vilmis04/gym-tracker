import { SignIn } from "@clerk/nextjs";
import { getLocale, getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/common/language/language-switcher";
import { ThemeToggle } from "@/components/common/theme/theme-toggle";
import { getSignInPath } from "@/lib/auth/auth-routes";
import { isClerkConfigured } from "@/lib/auth/clerk-env";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const translate = await getTranslations("auth");
  return { title: translate("signIn") };
}

/**
 * Sign-in (E04-T01): Clerk's `<SignIn />`, set up in the Clerk dashboard
 * with Google as the only method, so it shows just "Continue with Google".
 * `withSignUp` makes it one sign-in-or-up flow: a first Google sign-in
 * creates the account, no separate sign-up page. The catch-all route holds
 * the flow's later steps (`/lt/sign-in/sso-callback`). Where to go
 * afterwards comes from `redirect_url` (set by the proxy) or the
 * `AuthProvider` fallback (Home). The language and theme switches are here
 * too, as on the landing page, for someone who arrives from a link.
 */
export default async function SignInPage() {
  const [locale, translateAuth] = await Promise.all([
    getLocale(),
    getTranslations("auth"),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pt-[calc(1.75rem+env(safe-area-inset-top,0px))] pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))]">
      {isClerkConfigured() ? (
        <SignIn path={getSignInPath(locale)} routing="path" withSignUp />
      ) : (
        <div className="flex max-w-sm flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold">{translateAuth("signIn")}</h1>
          <p className="text-muted-foreground">
            {translateAuth("signInUnavailable")}
          </p>
        </div>
      )}
      <div className="flex flex-col items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </main>
  );
}
