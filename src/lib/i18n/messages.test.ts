import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import { MESSAGES } from "./messages";
import enMessages from "../../../messages/en.json";
import ltMessages from "../../../messages/lt.json";

const getKeyPaths = (messages: Record<string, Record<string, string>>) =>
  Object.entries(messages)
    .flatMap(([namespace, namespaceMessages]) =>
      Object.keys(namespaceMessages).map((key) => `${namespace}.${key}`),
    )
    .sort();

describe("messages", () => {
  it("has the same keys in English and Lithuanian", () => {
    expect(getKeyPaths(ltMessages)).toEqual(getKeyPaths(enMessages));
  });

  it("has no empty messages", () => {
    for (const messages of Object.values(MESSAGES)) {
      for (const namespaceMessages of Object.values(messages)) {
        for (const text of Object.values(namespaceMessages)) {
          expect(text.trim()).not.toBe("");
        }
      }
    }
  });

  it("uses typographic apostrophes, which ICU (next-intl) does not treat as quotes", () => {
    for (const messages of Object.values(MESSAGES)) {
      expect(JSON.stringify(messages)).not.toContain("'");
    }
  });
});

describe("next-intl with these messages", () => {
  it("has a namespace per feature (docs/epics/E03-i18n.md)", () => {
    for (const messages of Object.values(MESSAGES)) {
      expect(Object.keys(messages)).toEqual(
        expect.arrayContaining([
          "common",
          "nav",
          "auth",
          "buddies",
          "sessions",
          "exercises",
          "logging",
          "progress",
          "settings",
          "errors",
        ]),
      );
    }
  });

  it("looks up a namespace in the requested locale", () => {
    const translateNavLt = createTranslator({
      locale: "lt",
      messages: MESSAGES.lt,
      namespace: "nav",
    });
    const translateNavEn = createTranslator({
      locale: "en",
      messages: MESSAGES.en,
      namespace: "nav",
    });

    expect(translateNavLt("sessions")).toBe("Treniruotės");
    expect(translateNavEn("sessions")).toBe("Sessions");
  });
});

describe("plural messages (counts)", () => {
  const translateCountsLt = createTranslator({
    locale: "lt",
    messages: MESSAGES.lt,
    namespace: "counts",
  });
  const translateCountsEn = createTranslator({
    locale: "en",
    messages: MESSAGES.en,
    namespace: "counts",
  });
  const COUNTS = [1, 2, 10, 21, 22, 11, 0, 1.5];

  // CLDR's Lithuanian rules: one = 1, 21, 31…; few = 2–9, 22–29…; many =
  // decimals (genitive singular); other = 0, 10–20, 30… (genitive plural).
  it.each([
    [
      "sets",
      "1 serija | 2 serijos | 10 serijų | 21 serija | 22 serijos | 11 serijų | 0 serijų | 1,5 serijos",
    ],
    [
      "reps",
      "1 kartojimas | 2 kartojimai | 10 kartojimų | 21 kartojimas | 22 kartojimai | 11 kartojimų | 0 kartojimų | 1,5 kartojimo",
    ],
    [
      "sessions",
      "1 treniruotė | 2 treniruotės | 10 treniruočių | 21 treniruotė | 22 treniruotės | 11 treniruočių | 0 treniruočių | 1,5 treniruotės",
    ],
    [
      "exercises",
      "1 pratimas | 2 pratimai | 10 pratimų | 21 pratimas | 22 pratimai | 11 pratimų | 0 pratimų | 1,5 pratimo",
    ],
    [
      "buddies",
      "1 draugas | 2 draugai | 10 draugų | 21 draugas | 22 draugai | 11 draugų | 0 draugų | 1,5 draugo",
    ],
  ] as const)("counts %s in Lithuanian", (key, expected) => {
    expect(
      COUNTS.map((count) => translateCountsLt(key, { count })).join(" | "),
    ).toBe(expected);
  });

  it.each([
    ["sets", "1 set | 2 sets | 10 sets | 21 sets | 1.5 sets"],
    ["reps", "1 rep | 2 reps | 10 reps | 21 reps | 1.5 reps"],
    [
      "sessions",
      "1 session | 2 sessions | 10 sessions | 21 sessions | 1.5 sessions",
    ],
    [
      "exercises",
      "1 exercise | 2 exercises | 10 exercises | 21 exercises | 1.5 exercises",
    ],
    ["buddies", "1 buddy | 2 buddies | 10 buddies | 21 buddies | 1.5 buddies"],
  ] as const)("counts %s in English", (key, expected) => {
    expect(
      [1, 2, 10, 21, 1.5]
        .map((count) => translateCountsEn(key, { count }))
        .join(" | "),
    ).toBe(expected);
  });
});
