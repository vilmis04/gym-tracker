import { ChartLine } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/common/page/page-header";
import { getSectionMetadata } from "@/components/common/page/section-metadata";
import { EmptyState } from "@/components/ui/empty-state";

export function generateMetadata() {
  return getSectionMetadata("progress");
}

// Placeholder (E02-T06); the section's content comes with its epic.
export default async function ProgressPage() {
  const [translateNav, translateSection] = await Promise.all([
    getTranslations("nav"),
    getTranslations("progress"),
  ]);

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
