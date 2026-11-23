import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/common/language/language-switcher";
import { ThemeToggle } from "@/components/common/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { getSignInPath } from "@/lib/auth/auth-routes";

// Placeholder landing page (E01-T01, localized in E03-T01).
export default function LandingPage() {
  const translateCommon = useTranslations("common");
  const translateLanding = useTranslations("landing");
  const translateAuth = useTranslations("auth");
  const locale = useLocale();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
      <h1 className="text-2xl font-semibold">{translateCommon("appName")}</h1>
      <p>{translateLanding("comingSoon")}</p>
      {/* E04-T05 builds the real landing page ("Continue with Google"); it
          keeps both switches. */}
      <Button asChild className="mt-4">
        <Link href={getSignInPath(locale)}>{translateAuth("signIn")}</Link>
      </Button>
      <div className="mt-6 flex flex-col items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </main>
  );
}
