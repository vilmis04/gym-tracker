import { CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/common/page/page-header";
import { getSectionMetadata } from "@/components/common/page/section-metadata";
import { EmptyState } from "@/components/ui/empty-state";
import { getLocaleParam } from "@/lib/i18n/locale-param";
import { getTranslations } from "@/lib/i18n/messages";

export function generateMetadata({ params }: PageProps<"/[locale]/sessions">) {
  return getSectionMetadata(params, "sessions");
}

// Placeholder (E02-T06); the section's content comes with its epic.
export default async function SessionsPage({
  params,
}: PageProps<"/[locale]/sessions">) {
  const locale = await getLocaleParam(params);
  const translateNav = await getTranslations({ locale, namespace: "nav" });
  const translateSection = await getTranslations({
    locale,
    namespace: "sessions",
  });

  return (
    <>
      <PageHeader title={translateNav("sessions")} />
      <EmptyState
        icon={<CalendarDays aria-hidden="true" size={20} strokeWidth={1.5} />}
        message={translateSection("emptyState")}
      />
    </>
  );
}
