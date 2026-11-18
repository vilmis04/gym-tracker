"use client";

import { SectionError } from "@/components/common/page/section-error";

export default function ProgressError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <SectionError error={error} retry={retry} titleKey="progress" />;
}
