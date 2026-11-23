// @vitest-environment node
/**
 * The pieces of `npm run i18n:check` (E03-T04): comparing the messages files,
 * checking each message, reading the files, and the script's output and exit
 * code. The real messages are checked in src/lib/i18n/messages.test.ts.
 */
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import {
  checkMessageCatalogs,
  getMessageKeyPaths,
} from "../../../scripts/i18n/check-message-catalogs.mts";
import { readMessageCatalogs } from "../../../scripts/i18n/read-message-catalogs.mts";

import type { MessageTree } from "../../../scripts/i18n/message-catalogs.types.mts";

const execFileAsync = promisify(execFile);

const script = fileURLToPath(
  new URL("../../../scripts/check-i18n.mts", import.meta.url),
);

/**
 * An annotation and a report line per problem, e.g.
 * "::error file=…/lt.json::invalid ICU syntax in \"counts.sets\": …\n…/lt.json: invalid ICU syntax…".
 */
const PROBLEM_LINES_REGEX =
  /::error file=.*lt\.json::invalid ICU syntax in "counts\.sets".*\n.*lt\.json: invalid ICU syntax in "counts\.sets".*\n::error file=.*lt\.json::missing key "counts\.reps"\n.*lt\.json: missing key "counts\.reps"/;

const VALID_EN = {
  common: { save: "Save", remove: "Remove {item}" },
  counts: { sets: "{count, plural, one {# set} other {# sets}}" },
};

const VALID_LT = {
  common: { save: "Išsaugoti", remove: "Pašalinti {item}" },
  counts: {
    sets: "{count, plural, one {# serija} few {# serijos} many {# serijos} other {# serijų}}",
  },
};

const checkMessages = ({
  en = VALID_EN,
  lt = VALID_LT,
}: {
  en?: MessageTree;
  lt?: MessageTree;
}) =>
  checkMessageCatalogs({
    catalogs: [
      { fileName: "messages/en.json", locale: "en", messages: en },
      { fileName: "messages/lt.json", locale: "lt", messages: lt },
    ],
  });

const withCount = (messages: MessageTree, sets: string): MessageTree => ({
  ...messages,
  counts: { sets },
});

describe("checkMessageCatalogs", () => {
  it("passes matching, valid files", () => {
    expect(checkMessages({})).toEqual([]);
  });

  it("reports a key only in en.json as missing in lt.json, with its path", () => {
    expect(
      checkMessages({
        en: {
          ...VALID_EN,
          counts: { ...VALID_EN.counts, reps: "{count} reps" },
        },
      }),
    ).toEqual([
      {
        fileName: "messages/lt.json",
        keyPath: "counts.reps",
        description: 'missing key "counts.reps"',
      },
    ]);
  });

  it("reports a key only in lt.json as missing in en.json", () => {
    expect(
      checkMessages({
        lt: { ...VALID_LT, common: { ...VALID_LT.common, back: "Atgal" } },
      }),
    ).toEqual([
      {
        fileName: "messages/en.json",
        keyPath: "common.back",
        description: 'missing key "common.back"',
      },
    ]);
  });

  it("lists every key of a missing group, at any depth", () => {
    const problems = checkMessages({
      en: {
        ...VALID_EN,
        settings: { profile: { title: "Profile", save: "Save profile" } },
      },
      lt: { ...VALID_LT, settings: {} },
    });

    expect(problems.map(({ description }) => description)).toEqual([
      'missing key "settings.profile.title"',
      'missing key "settings.profile.save"',
    ]);
  });

  it("reports a message in one file that is a group in the other", () => {
    expect(checkMessages({ lt: { ...VALID_LT, common: "Bendra" } })).toEqual([
      {
        fileName: "messages/lt.json",
        keyPath: "common",
        description:
          '"common" is a message here but a group of keys in messages/en.json',
      },
    ]);
  });

  it("reports empty and whitespace-only values", () => {
    const problems = checkMessages({
      en: { ...VALID_EN, common: { save: "", remove: " Remove {item}" } },
      lt: { ...VALID_LT, common: { save: "  ", remove: "Pašalinti {item}" } },
    });

    expect(problems).toEqual([
      {
        fileName: "messages/en.json",
        keyPath: "common.save",
        description: 'empty value for "common.save"',
      },
      {
        fileName: "messages/lt.json",
        keyPath: "common.save",
        description: 'empty value for "common.save"',
      },
    ]);
  });

  it("reports broken ICU syntax such as an unclosed plural", () => {
    expect(
      checkMessages({
        lt: withCount(
          VALID_LT,
          "{count, plural, one {# serija} few {# serijos} many {# serijos} other {# serijų}",
        ),
      }),
    ).toEqual([
      {
        fileName: "messages/lt.json",
        keyPath: "counts.sets",
        description:
          'invalid ICU syntax in "counts.sets": EXPECT_ARGUMENT_CLOSING_BRACE at line 1, column 1',
      },
    ]);
    expect(
      checkMessages({
        en: withCount(VALID_EN, "{count, plural, one {# set}}"),
      }),
    ).toEqual([
      expect.objectContaining({
        fileName: "messages/en.json",
        description: expect.stringContaining("MISSING_OTHER_CLAUSE"),
      }),
    ]);
  });

  it("reports plural categories the locale needs but the message lacks", () => {
    expect(
      checkMessages({
        lt: withCount(
          VALID_LT,
          "{count, plural, one {# serija} few {# serijos} other {# serijų}}",
        ),
        en: withCount(VALID_EN, "{count, plural, =0 {No sets} other {# sets}}"),
      }),
    ).toEqual([
      {
        fileName: "messages/en.json",
        keyPath: "counts.sets",
        description:
          '"counts.sets": the plural {count} is missing one (this locale needs one, other)',
      },
      {
        fileName: "messages/lt.json",
        keyPath: "counts.sets",
        description:
          '"counts.sets": the plural {count} is missing many (this locale needs one, few, many, other)',
      },
    ]);
  });

  it("checks ordinal plurals (selectordinal) against the ordinal categories", () => {
    const problems = checkMessages({
      en: {
        ...VALID_EN,
        progress: { place: "{place, selectordinal, one {#st} other {#th}}" },
      },
      lt: {
        ...VALID_LT,
        progress: { place: "{place, selectordinal, other {#-as}}" },
      },
    });

    expect(problems.map(({ description }) => description)).toEqual([
      '"progress.place": the plural {place} is missing two, few (this locale needs one, two, few, other)',
    ]);
  });

  it("checks plurals nested in other plurals and select options", () => {
    const problems = checkMessages({
      lt: withCount(
        VALID_LT,
        "{gender, select, female {{count, plural, one {# serija} other {# serijų}}} other {# serijų}}",
      ),
      en: withCount(
        VALID_EN,
        "{gender, select, female {{count, plural, one {# set} other {# sets}}} other {# sets}}",
      ),
    });

    expect(problems.map(({ description }) => description)).toEqual([
      '"counts.sets": the plural {count} is missing few, many (this locale needs one, few, many, other)',
    ]);
  });

  it("reports arguments that differ from en.json", () => {
    expect(
      checkMessages({
        lt: {
          ...VALID_LT,
          common: {
            save: "Išsaugoti <b>{what}</b>",
            remove: "Pašalinti {name}",
          },
        },
      }),
    ).toEqual([
      {
        fileName: "messages/lt.json",
        keyPath: "common.save",
        description:
          '"common.save" uses the arguments <b>, {what} but messages/en.json uses none',
      },
      {
        fileName: "messages/lt.json",
        keyPath: "common.remove",
        description:
          '"common.remove" uses the arguments {name} but messages/en.json uses {item}',
      },
    ]);
  });

  it("rejects the ASCII apostrophe, which ICU treats as a quote", () => {
    expect(
      checkMessages({
        en: { ...VALID_EN, common: { ...VALID_EN.common, save: "Don't save" } },
      }),
    ).toEqual([
      expect.objectContaining({
        fileName: "messages/en.json",
        keyPath: "common.save",
        description: expect.stringContaining("ASCII apostrophe"),
      }),
    ]);
  });

  it("reports every problem at once, grouped by file", () => {
    const problems = checkMessages({
      en: { ...VALID_EN, counts: { ...VALID_EN.counts, reps: "{count} reps" } },
      lt: {
        ...VALID_LT,
        common: { save: "", remove: "Pašalinti {name}", back: "Atgal" },
      },
    });

    expect(problems.map(({ fileName }) => fileName)).toEqual([
      "messages/en.json",
      "messages/lt.json",
      "messages/lt.json",
      "messages/lt.json",
    ]);
  });
});

describe("getMessageKeyPaths", () => {
  it("lists the dot-separated path of every message", () => {
    expect(
      getMessageKeyPaths({
        messages: { ...VALID_EN, deep: { nested: { key: "Text" } } },
      }),
    ).toEqual([
      "common.save",
      "common.remove",
      "counts.sets",
      "deep.nested.key",
    ]);
  });
});

describe("readMessageCatalogs and check-i18n.mts", () => {
  let directory: string | undefined;

  const writeMessagesFiles = async (files: Record<string, string>) => {
    directory = await mkdtemp(join(tmpdir(), "i18n-check-"));
    const messagesDirectory = directory;
    await Promise.all(
      Object.entries(files).map(([fileName, text]) =>
        writeFile(join(messagesDirectory, fileName), text),
      ),
    );
    return messagesDirectory;
  };

  afterEach(async () => {
    if (directory !== undefined) await rm(directory, { recursive: true });
    directory = undefined;
  });

  it("reads every <locale>.json, the reference locale first", async () => {
    const messagesDirectory = await writeMessagesFiles({
      "en.json": JSON.stringify(VALID_EN),
      "lt.json": JSON.stringify(VALID_LT),
      "README.md": "not a messages file",
    });

    const catalogs = await readMessageCatalogs({
      directory: messagesDirectory,
      referenceLocale: "lt",
    });

    expect(catalogs.map(({ locale }) => locale)).toEqual(["lt", "en"]);
    expect(catalogs[1]?.messages).toEqual(VALID_EN);
  });

  it.each([
    ["the reference file is missing", { "lt.json": "{}" }, "en.json not found"],
    ["a file isn't JSON", { "en.json": "{ broken" }, "not valid JSON"],
    [
      "a message isn't a string",
      { "en.json": '{ "common": { "count": 3 } }' },
      "expected nested objects of string messages",
    ],
    [
      "a file isn't named after a locale",
      { "en.json": "{}", "x_y.json": "{}" },
      '"x_y" is not a locale Intl knows',
    ],
  ])("fails fast when %s", async (_case, files, expectedError) => {
    const messagesDirectory = await writeMessagesFiles(files);

    await expect(
      readMessageCatalogs({
        directory: messagesDirectory,
        referenceLocale: "en",
      }),
    ).rejects.toThrow(expectedError);
  });

  it("exits 0 for the real messages files", async () => {
    const { stdout } = await execFileAsync(process.execPath, [script]);

    expect(stdout).toContain(
      "messages/en.json, messages/lt.json have matching keys",
    );
  });

  it("exits 1 and lists the file and key path of every problem", async () => {
    const messagesDirectory = await writeMessagesFiles({
      "en.json": JSON.stringify({
        ...VALID_EN,
        counts: { ...VALID_EN.counts, reps: "{count} reps" },
      }),
      "lt.json": JSON.stringify(withCount(VALID_LT, "{count, plural, one {#}")),
    });

    await expect(
      execFileAsync(process.execPath, [script, messagesDirectory], {
        env: { ...process.env, GITHUB_ACTIONS: "true" },
      }),
    ).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringMatching(PROBLEM_LINES_REGEX),
      stderr: expect.stringContaining("2 translation problems"),
    });
  });

  it("exits 2 when a file can't be read as messages", async () => {
    const messagesDirectory = await writeMessagesFiles({ "en.json": "[" });

    await expect(
      execFileAsync(process.execPath, [script, messagesDirectory]),
    ).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining("not valid JSON"),
    });
  });
});
