import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/common/language/language-switcher";
import { ThemeToggle } from "@/components/common/theme/theme-toggle";

// Placeholder landing page (E01-T01, localized in E03-T01).
export default function LandingPage() {
  const translateCommon = useTranslations("common");
  const translateLanding = useTranslations("landing");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
      <h1 className="text-2xl font-semibold">{translateCommon("appName")}</h1>
      <p>{translateLanding("comingSoon")}</p>
      {/* E04-T05 builds the real landing page; it keeps both switches. */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </main>
  );
}
