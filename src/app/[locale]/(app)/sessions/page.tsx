import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/common/page/page-header";
import { getSectionMetadata } from "@/components/common/page/section-metadata";
import { EmptyState } from "@/components/ui/empty-state";

export function generateMetadata() {
  return getSectionMetadata("sessions");
}

// Placeholder (E02-T06); the section's content comes with its epic.
export default async function SessionsPage() {
  const [translateNav, translateSection] = await Promise.all([
    getTranslations("nav"),
    getTranslations("sessions"),
  ]);

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
