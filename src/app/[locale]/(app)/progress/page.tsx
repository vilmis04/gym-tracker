import { ChartLine } from "lucide-react";

import { PageHeader } from "@/components/common/page/page-header";
import { getSectionMetadata } from "@/components/common/page/section-metadata";
import { EmptyState } from "@/components/ui/empty-state";
import { getLocaleParam } from "@/lib/i18n/locale-param";
import { getTranslations } from "@/lib/i18n/messages";

export function generateMetadata({ params }: PageProps<"/[locale]/progress">) {
  return getSectionMetadata(params, "progress");
}

// Placeholder (E02-T06); the section's content comes with its epic.
export default async function ProgressPage({
  params,
}: PageProps<"/[locale]/progress">) {
  const locale = await getLocaleParam(params);
  const translateNav = await getTranslations({ locale, namespace: "nav" });
  const translateSection = await getTranslations({
    locale,
    namespace: "progress",
  });

  return (
    <>
      <PageHeader title={translateNav("progress")} />
      <EmptyState
        icon={<ChartLine aria-hidden="true" size={20} strokeWidth={1.5} />}
        message={translateSection("emptyState")}
      />
    </>
  );
}
