import { House } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/common/page/page-header";
import { getSectionMetadata } from "@/components/common/page/section-metadata";
import { EmptyState } from "@/components/ui/empty-state";

export function generateMetadata() {
  return getSectionMetadata("home");
}

// Placeholder (E02-T06); the section's content comes with its epic.
export default async function HomePage() {
  const [translateNav, translateSection] = await Promise.all([
    getTranslations("nav"),
    getTranslations("home"),
  ]);

  return (
    <>
      <PageHeader title={translateNav("home")} />
      <EmptyState
        icon={<House aria-hidden="true" size={20} strokeWidth={1.5} />}
        message={translateSection("emptyState")}
      />
    </>
  );
}
