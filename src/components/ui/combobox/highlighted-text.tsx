import { findMatchRanges } from "@/lib/utils/normalize-search-text";

import type { HighlightedTextProps } from "./combobox.types";

/**
 * `text` with every accent- and case-insensitive occurrence of the query in
 * a `<mark>`, styled like the mock-ups' bold match (no fill): "spaud" marks
 * "Špaud" in "Špaudimas". One `<span>`, so it is a single flex item.
 */
export function HighlightedText({
  text,
  normalizedQuery,
}: HighlightedTextProps) {
  const ranges = findMatchRanges(text, normalizedQuery);
  if (ranges.length === 0) return <span>{text}</span>;

  const segments = [];
  let previousEnd = 0;
  for (const { start, end } of ranges) {
    if (start > previousEnd) segments.push(text.slice(previousEnd, start));
    segments.push(
      <mark
        key={start}
        className="bg-transparent font-semibold text-foreground"
      >
        {text.slice(start, end)}
      </mark>,
    );
    previousEnd = end;
  }
  if (previousEnd < text.length) segments.push(text.slice(previousEnd));
  return <span>{segments}</span>;
}
