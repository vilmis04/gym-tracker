"use client";

import { SectionError } from "@/components/common/page/section-error";

export default function SessionsError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <SectionError error={error} retry={retry} titleKey="sessions" />;
}
