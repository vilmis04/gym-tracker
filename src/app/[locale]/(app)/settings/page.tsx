import { Settings } from "lucide-react";

import { getAppPath } from "@/components/common/app-shell/nav-items";
import { PageHeader } from "@/components/common/page/page-header";
import { getSectionMetadata } from "@/components/common/page/section-metadata";
import { EmptyState } from "@/components/ui/empty-state";
import { getLocaleParam } from "@/lib/i18n/locale-param";
import { getTranslations } from "@/lib/i18n/messages";

export function generateMetadata({ params }: PageProps<"/[locale]/settings">) {
  return getSectionMetadata(params, "settings");
}

// Placeholder (E02-T06); the section's content comes with its epic.
export default async function SettingsPage({
  params,
}: PageProps<"/[locale]/settings">) {
  const locale = await getLocaleParam(params);
  const translateNav = await getTranslations({ locale, namespace: "nav" });
  const translateSection = await getTranslations({
    locale,
    namespace: "settings",
  });

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
