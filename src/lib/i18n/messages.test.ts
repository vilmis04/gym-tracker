import { describe, expect, it } from "vitest";

import { createTranslator, getTranslations, MESSAGES } from "./messages";
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

describe("getTranslations", () => {
  it("looks up a namespace in the requested locale", async () => {
    const translateNavLt = await getTranslations({
      locale: "lt",
      namespace: "nav",
    });
    const translateNavEn = createTranslator({ locale: "en", namespace: "nav" });

    expect(translateNavLt("sessions")).toBe("Treniruotės");
    expect(translateNavEn("sessions")).toBe("Sessions");
  });
});
