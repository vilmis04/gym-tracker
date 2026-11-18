import type { TextRange } from "./normalize-search-text.types";

/**
 * The canonical form for comparing and matching search text: trimmed,
 * lowercase, accents removed ("  Špaudimas " → "spaudimas"). It mirrors the
 * database's `lower(f_unaccent(trim(name)))` for the letters the app uses
 * (Lithuanian and Latin accents decompose under NFD).
 */
export function normalizeSearchText(text: string): string {
  return removeAccents(text.trim().toLowerCase());
}

/**
 * Where `normalizedQuery` (already passed through `normalizeSearchText`)
 * occurs in `text`, ignoring case and accents, as ranges of the original
 * text, so "spaud" marks "Špaud" in "Špaudimas". Non-overlapping, in order;
 * empty for an empty query.
 */
export function findMatchRanges(
  text: string,
  normalizedQuery: string,
): readonly TextRange[] {
  if (normalizedQuery === "") return [];

  // normalizedText[i] came from text[sources[i].start .. sources[i].end): one
  // source character can become 0 (a lone combining mark) or several
  // normalized characters.
  let normalizedText = "";
  const sources: TextRange[] = [];
  let sourceIndex = 0;
  for (const character of text) {
    const normalizedCharacter = removeAccents(character.toLowerCase());
    const source = { start: sourceIndex, end: sourceIndex + character.length };
    for (let i = 0; i < normalizedCharacter.length; i++) sources.push(source);
    const previousSource = sources.at(-1);
    if (normalizedCharacter === "" && previousSource) {
      // A decomposed accent belongs to the letter before it.
      previousSource.end = source.end;
    }
    normalizedText += normalizedCharacter;
    sourceIndex = source.end;
  }

  const ranges: TextRange[] = [];
  let matchIndex = normalizedText.indexOf(normalizedQuery);
  while (matchIndex !== -1) {
    const firstSource = sources[matchIndex];
    const lastSource = sources[matchIndex + normalizedQuery.length - 1];
    if (firstSource && lastSource) {
      ranges.push({ start: firstSource.start, end: lastSource.end });
    }
    matchIndex = normalizedText.indexOf(
      normalizedQuery,
      matchIndex + normalizedQuery.length,
    );
  }
  return ranges;
}

// Unicode combining marks left by NFD, e.g. the caron in "Š" → "S" + "̌".
const COMBINING_MARKS_REGEX = /\p{Mark}/gu;

const removeAccents = (text: string) =>
  text.normalize("NFD").replace(COMBINING_MARKS_REGEX, "");
