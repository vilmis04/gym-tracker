import { describe, expect, it } from "vitest";

import { findMatchRanges, normalizeSearchText } from "./normalize-search-text";

const markMatches = (text: string, query: string) => {
  let marked = "";
  let previousEnd = 0;
  for (const { start, end } of findMatchRanges(
    text,
    normalizeSearchText(query),
  )) {
    marked += `${text.slice(previousEnd, start)}[${text.slice(start, end)}]`;
    previousEnd = end;
  }
  return marked + text.slice(previousEnd);
};

describe("normalizeSearchText", () => {
  it("trims, lowercases and removes accents", () => {
    expect(normalizeSearchText("  Špaudimas Gulint ")).toBe("spaudimas gulint");
    expect(normalizeSearchText("Pritūpimai")).toBe("pritupimai");
    expect(normalizeSearchText("ĄČĘĖĮŠŲŪŽ ąčęėįšųūž")).toBe(
      "aceeisuuz aceeisuuz",
    );
    expect(normalizeSearchText("Crème brûlée")).toBe("creme brulee");
  });

  it("gives composed and decomposed spellings the same form", () => {
    const composed = "Š".normalize("NFC");
    const decomposed = "Š".normalize("NFD");
    expect(composed).not.toBe(decomposed);
    expect(normalizeSearchText(composed)).toBe(normalizeSearchText(decomposed));
  });

  it("keeps inner spaces (like the database's lower(unaccent(trim())))", () => {
    expect(normalizeSearchText(" Bench  press ")).toBe("bench  press");
  });
});

describe("findMatchRanges", () => {
  it("matches across accents and case", () => {
    expect(markMatches("Špaudimas", "spaudimas")).toBe("[Špaudimas]");
    expect(markMatches("spaudimas", "Špaudimas")).toBe("[spaudimas]");
    expect(markMatches("Pritūpimai", "tup")).toBe("Pri[tūp]imai");
    expect(markMatches("Hack squat", "SQU")).toBe("Hack [squ]at");
  });

  it("marks every non-overlapping occurrence", () => {
    expect(markMatches("Squat to squat", "squat")).toBe("[Squat] to [squat]");
    expect(markMatches("aaaa", "aa")).toBe("[aa][aa]");
  });

  it("keeps a decomposed accent with its letter", () => {
    const decomposed = "Špaudimas".normalize("NFD");
    expect(findMatchRanges(decomposed, "s")).toEqual([
      { start: 0, end: 2 },
      { start: 9, end: 10 },
    ]);
  });

  it("returns no ranges for an empty query or no match", () => {
    expect(findMatchRanges("Squat", "")).toEqual([]);
    expect(findMatchRanges("Squat", "bench")).toEqual([]);
  });
});
