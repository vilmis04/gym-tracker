/**
 * `npm run i18n:check` (E03-T04): compares the key trees of the messages files
 * (messages/en.json is the reference) and checks every message: missing keys
 * in either file, empty values, ASCII apostrophes, ICU syntax errors, plural
 * categories the locale needs, and arguments that differ from en.json. Lists
 * every problem as "<file>: <problem>" and exits 1 if there is any.
 * Usage: node scripts/check-i18n.mts [path/to/messages-directory]
 */
import { fileURLToPath } from "node:url";

import {
  checkMessageCatalogs,
  getMessageKeyPaths,
} from "./i18n/check-message-catalogs.mts";
import { readMessageCatalogs } from "./i18n/read-message-catalogs.mts";

/** The locale `MESSAGES` (src/lib/i18n/messages.ts) is typed against. */
const REFERENCE_LOCALE = "en";

const DEFAULT_MESSAGES_DIRECTORY = fileURLToPath(
  new URL("../messages", import.meta.url),
);

const messagesDirectory = process.argv[2] ?? DEFAULT_MESSAGES_DIRECTORY;
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

try {
  const catalogs = await readMessageCatalogs({
    directory: messagesDirectory,
    referenceLocale: REFERENCE_LOCALE,
  });
  const problems = checkMessageCatalogs({ catalogs });
  const fileNames = catalogs.map(({ fileName }) => fileName).join(", ");

  for (const { fileName, description } of problems) {
    if (isGitHubActions)
      console.log(`::error file=${fileName}::${description}`);
    console.log(`${fileName}: ${description}`);
  }

  if (problems.length > 0) {
    console.error(
      `\n${problems.length} translation ${problems.length === 1 ? "problem" : "problems"} in ${fileNames}. Every key needs a non-empty message in every file; see README → Adding a string.`,
    );
    process.exitCode = 1;
  } else {
    const messageCount = catalogs.reduce(
      (count, { messages }) => count + getMessageKeyPaths({ messages }).length,
      0,
    );
    console.log(
      `All ${messageCount} messages in ${fileNames} have matching keys, plural categories and arguments, and valid ICU syntax.`,
    );
  }
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 2;
}
