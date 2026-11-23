"use client";

import { useFormat } from "@/lib/i18n/format/use-format";

import { FormatSampleList } from "./format-sample-list";
import { getFormatSamples } from "./format-samples";

/** The samples from `useFormat()`: the browser's time zone after hydration. */
export function ClientFormatSamples({ label }: { label: string }) {
  const format = useFormat();
  return <FormatSampleList label={label} samples={getFormatSamples(format)} />;
}
