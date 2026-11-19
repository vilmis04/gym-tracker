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
