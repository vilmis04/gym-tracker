import { Settings } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getAppPath } from "@/components/common/app-shell/nav-items";
import { PageHeader } from "@/components/common/page/page-header";
import { getSectionMetadata } from "@/components/common/page/section-metadata";
import { EmptyState } from "@/components/ui/empty-state";

export function generateMetadata() {
  return getSectionMetadata("settings");
}

// Placeholder (E02-T06); the section's content comes with its epic.
export default async function SettingsPage() {
  const [locale, translateNav, translateSection] = await Promise.all([
    getLocale(),
    getTranslations("nav"),
    getTranslations("settings"),
  ]);

  return (
    <>
      <PageHeader
        title={translateNav("settings")}
        backHref={getAppPath(locale, "dashboard")}
      />
      <EmptyState
        icon={<Settings aria-hidden="true" size={20} strokeWidth={1.5} />}
        message={translateSection("emptyState")}
      />
    </>
  );
}
