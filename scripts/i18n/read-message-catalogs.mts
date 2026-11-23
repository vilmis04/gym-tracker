import { readdir, readFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";

import { z } from "zod";

import type { MessageCatalog, MessageTree } from "./message-catalogs.types.mts";

/** A messages file name, e.g. "lt.json" (locale "lt"). */
const MESSAGES_FILE_NAME_REGEX = /^(?<locale>[^.]+)\.json$/;

const messageTreeSchema: z.ZodType<MessageTree> = z.lazy(() =>
  z.record(z.string(), z.union([z.string(), messageTreeSchema])),
);

/**
 * Reads every `<locale>.json` in the directory, the reference locale first
 * (the one `checkMessageCatalogs` compares arguments against).
 *
 * @throws {Error} When the reference file is missing, or a file isn't valid
 * JSON, isn't a tree of strings, or isn't named after a locale `Intl` knows.
 * These stop the check before any key is compared.
 */
export async function readMessageCatalogs({
  directory,
  referenceLocale,
}: {
  directory: string;
  referenceLocale: string;
}): Promise<MessageCatalog[]> {
  const referenceFileName = `${referenceLocale}.json`;
  const fileNames = (await readdir(directory))
    .filter((fileName) => MESSAGES_FILE_NAME_REGEX.test(fileName))
    .sort();
  if (!fileNames.includes(referenceFileName)) {
    throw new Error(
      `${formatPath(join(directory, referenceFileName))} not found; it is the reference all other messages files are compared with.`,
    );
  }
  const orderedFileNames = [
    referenceFileName,
    ...fileNames.filter((fileName) => fileName !== referenceFileName),
  ];
  return Promise.all(
    orderedFileNames.map((fileName) =>
      readMessageCatalog({ filePath: join(directory, fileName) }),
    ),
  );
}

async function readMessageCatalog({
  filePath,
}: {
  filePath: string;
}): Promise<MessageCatalog> {
  const fileName = formatPath(filePath);
  const locale =
    MESSAGES_FILE_NAME_REGEX.exec(basename(filePath))?.groups?.locale ?? "";
  if (!isKnownLocale(locale)) {
    throw new Error(
      `${fileName}: "${locale}" is not a locale Intl knows; name messages files <locale>.json.`,
    );
  }

  const text = await readFile(filePath, "utf8");
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`${fileName}: not valid JSON (${String(error)}).`);
  }
  const parsedMessages = messageTreeSchema.safeParse(json);
  if (!parsedMessages.success) {
    throw new Error(
      `${fileName}: expected nested objects of string messages.\n${z.prettifyError(parsedMessages.error)}`,
    );
  }
  return { fileName, locale, messages: parsedMessages.data };
}

const isKnownLocale = (locale: string) => {
  try {
    return Intl.PluralRules.supportedLocalesOf([locale]).length === 1;
  } catch {
    return false;
  }
};

/** Relative to the working directory, so the report reads "messages/lt.json". */
const formatPath = (filePath: string) => relative(process.cwd(), filePath);
