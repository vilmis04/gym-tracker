import {
  isArgumentElement,
  isDateElement,
  isNumberElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  parse,
  type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser";
import { z } from "zod";

import type {
  MessageCatalog,
  MessageProblem,
  MessageTree,
} from "./message-catalogs.types.mts";

/** CLDR's order, so reports list plural categories the way translators know them. */
const PLURAL_CATEGORY_ORDER = ["zero", "one", "two", "few", "many", "other"];

/** The parser throws a SyntaxError whose message is a code like "EXPECT_ARGUMENT_CLOSING_BRACE". */
const icuSyntaxErrorSchema = z.object({
  message: z.string(),
  location: z
    .object({ start: z.object({ line: z.number(), column: z.number() }) })
    .optional(),
});

type PluralCategories = Record<Intl.PluralRuleType, string[]>;

/** A catalog with its locale's plural categories, worked out once per run. */
type CheckedCatalog = MessageCatalog & { pluralCategories: PluralCategories };

type CatalogNode = {
  catalog: CheckedCatalog;
  node: string | MessageTree | undefined;
};

type CatalogGroup = { catalog: CheckedCatalog; group: MessageTree };

type CatalogMessage = { catalog: CheckedCatalog; text: string };

type MessageAnalysis = {
  descriptions: string[];
  /**
   * What the caller passes, as written: "{item}", "<link>". `null` when the
   * message is empty or doesn't parse, so it can't be compared.
   */
  argumentNames: string[] | null;
};

/**
 * Checks messages files against each other and each message on its own, and
 * returns every problem (empty when all pass), grouped by file in catalog
 * order:
 * - a key (at any depth) missing in a file, or a message in one file and a
 *   group of keys in another;
 * - an empty message, an ASCII apostrophe (ICU quoting; write `’`), invalid
 *   ICU syntax (e.g. an unclosed `{count, plural`);
 * - a plural without every category the file's locale needs (`Intl.PluralRules`:
 *   `one`, `other` in English; `one`, `few`, `many`, `other` in Lithuanian);
 * - arguments that differ from the first catalog's (the reference, `en.json`,
 *   which `MESSAGES` is typed against), e.g. `{item}` vs `{name}`.
 */
export function checkMessageCatalogs({
  catalogs,
}: {
  catalogs: MessageCatalog[];
}): MessageProblem[] {
  const problems = compareGroups({
    groups: catalogs.map((catalog) => ({
      catalog: {
        ...catalog,
        pluralCategories: getPluralCategories(catalog.locale),
      },
      group: catalog.messages,
    })),
    parentKeyPath: [],
  });
  return catalogs.flatMap(({ fileName }) =>
    problems.filter((problem) => problem.fileName === fileName),
  );
}

/** Dot-separated paths of every message in the tree, e.g. ["common.save", "counts.sets"]. */
export function getMessageKeyPaths({
  messages,
  parentKeyPath = [],
}: {
  messages: MessageTree;
  parentKeyPath?: string[];
}): string[] {
  return Object.entries(messages).flatMap(([key, node]) =>
    typeof node === "string"
      ? [[...parentKeyPath, key].join(".")]
      : getMessageKeyPaths({
          messages: node,
          parentKeyPath: [...parentKeyPath, key],
        }),
  );
}

function compareGroups({
  groups,
  parentKeyPath,
}: {
  groups: CatalogGroup[];
  parentKeyPath: string[];
}): MessageProblem[] {
  const keys = [...new Set(groups.flatMap(({ group }) => Object.keys(group)))];
  return keys.flatMap((key) =>
    compareNodes({
      nodes: groups.map(({ catalog, group }) => ({
        catalog,
        node: group[key],
      })),
      keyPath: [...parentKeyPath, key],
    }),
  );
}

function compareNodes({
  nodes,
  keyPath,
}: {
  nodes: CatalogNode[];
  keyPath: string[];
}): MessageProblem[] {
  const keyPathText = keyPath.join(".");
  const messages = nodes.flatMap(({ catalog, node }) =>
    typeof node === "string" ? [{ catalog, text: node }] : [],
  );
  const groups = nodes.flatMap(({ catalog, node }) =>
    typeof node === "object" ? [{ catalog, group: node }] : [],
  );
  // The first file that has the key decides whether it is a message or a group.
  const isMessage =
    typeof nodes.find(({ node }) => node !== undefined)?.node === "string";
  const missingKeyPaths = isMessage
    ? [keyPathText]
    : [
        ...new Set(
          groups.flatMap(({ group }) =>
            getMessageKeyPaths({ messages: group, parentKeyPath: keyPath }),
          ),
        ),
      ];

  const missingProblems = nodes
    .filter(({ node }) => node === undefined)
    .flatMap(({ catalog }) =>
      missingKeyPaths.map((missingKeyPath) => ({
        fileName: catalog.fileName,
        keyPath: missingKeyPath,
        description: `missing key "${missingKeyPath}"`,
      })),
    );

  if (isMessage) {
    const [expected] = messages;
    const kindProblems = groups.map(({ catalog }) => ({
      fileName: catalog.fileName,
      keyPath: keyPathText,
      description: `"${keyPathText}" is a group of keys here but a message in ${expected?.catalog.fileName}`,
    }));
    return [
      ...missingProblems,
      ...kindProblems,
      ...checkMessages({ messages, keyPathText }),
    ];
  }

  const [expected] = groups;
  const kindProblems = messages.map(({ catalog }) => ({
    fileName: catalog.fileName,
    keyPath: keyPathText,
    description: `"${keyPathText}" is a message here but a group of keys in ${expected?.catalog.fileName}`,
  }));
  return [
    ...missingProblems,
    ...kindProblems,
    ...compareGroups({ groups, parentKeyPath: keyPath }),
  ];
}

function checkMessages({
  messages,
  keyPathText,
}: {
  messages: CatalogMessage[];
  keyPathText: string;
}): MessageProblem[] {
  const analyses = messages.map(({ catalog, text }) => ({
    catalog,
    ...analyzeMessage({
      text,
      keyPathText,
      pluralCategories: catalog.pluralCategories,
    }),
  }));
  const [reference] = analyses;
  const referenceArgumentNames = reference?.argumentNames ?? null;

  return analyses.flatMap(({ catalog, descriptions, argumentNames }) => {
    const isArgumentMismatch =
      catalog !== reference?.catalog &&
      referenceArgumentNames !== null &&
      argumentNames !== null &&
      formatArgumentNames(argumentNames) !==
        formatArgumentNames(referenceArgumentNames);
    const allDescriptions = isArgumentMismatch
      ? [
          ...descriptions,
          `"${keyPathText}" uses the arguments ${formatArgumentNames(argumentNames)} but ${reference?.catalog.fileName} uses ${formatArgumentNames(referenceArgumentNames)}`,
        ]
      : descriptions;
    return allDescriptions.map((description) => ({
      fileName: catalog.fileName,
      keyPath: keyPathText,
      description,
    }));
  });
}

function analyzeMessage({
  text,
  keyPathText,
  pluralCategories,
}: {
  text: string;
  keyPathText: string;
  pluralCategories: PluralCategories;
}): MessageAnalysis {
  if (text.trim() === "") {
    return {
      descriptions: [`empty value for "${keyPathText}"`],
      argumentNames: null,
    };
  }

  const apostropheDescriptions = text.includes("'")
    ? [
        `"${keyPathText}" contains an ASCII apostrophe ('); write ’ instead (ICU treats ' as a quote)`,
      ]
    : [];

  let elements: MessageFormatElement[];
  try {
    elements = flattenElements(parse(text));
  } catch (error) {
    return {
      descriptions: [
        ...apostropheDescriptions,
        `invalid ICU syntax in "${keyPathText}": ${formatSyntaxError(error)}`,
      ],
      argumentNames: null,
    };
  }

  const pluralDescriptions = elements
    .filter(isPluralElement)
    // `selectordinal` sets pluralType "ordinal"; `plural` sets "cardinal".
    .flatMap(({ value: argumentName, options, pluralType = "cardinal" }) => {
      const requiredCategories = pluralCategories[pluralType];
      const missingCategories = requiredCategories.filter(
        (category) => !(category in options),
      );
      return missingCategories.length === 0
        ? []
        : [
            `"${keyPathText}": the plural {${argumentName}} is missing ${missingCategories.join(", ")} (this locale needs ${requiredCategories.join(", ")})`,
          ];
    });

  return {
    descriptions: [...apostropheDescriptions, ...pluralDescriptions],
    argumentNames: [...new Set(elements.flatMap(getArgumentName))].sort(),
  };
}

/** The elements and, recursively, those inside plural/select options and rich-text tags. */
function flattenElements(
  elements: MessageFormatElement[],
): MessageFormatElement[] {
  return elements.flatMap((element) => {
    if (isPluralElement(element) || isSelectElement(element)) {
      return [
        element,
        ...Object.values(element.options).flatMap(({ value }) =>
          flattenElements(value),
        ),
      ];
    }
    if (isTagElement(element)) {
      return [element, ...flattenElements(element.children)];
    }
    return [element];
  });
}

/** The value the caller passes for the element: `{item, number}` → "{item}", `<link>…</link>` → "<link>". */
function getArgumentName(element: MessageFormatElement): string[] {
  if (isTagElement(element)) return [`<${element.value}>`];
  const isArgument =
    isArgumentElement(element) ||
    isNumberElement(element) ||
    isDateElement(element) ||
    isTimeElement(element) ||
    isPluralElement(element) ||
    isSelectElement(element);
  return isArgument ? [`{${element.value}}`] : [];
}

function getPluralCategories(locale: string): PluralCategories {
  const getCategories = (type: Intl.PluralRuleType) => {
    const categories: string[] = new Intl.PluralRules(locale, {
      type,
    }).resolvedOptions().pluralCategories;
    return PLURAL_CATEGORY_ORDER.filter((category) =>
      categories.includes(category),
    );
  };
  return {
    cardinal: getCategories("cardinal"),
    ordinal: getCategories("ordinal"),
  };
}

function formatSyntaxError(error: unknown): string {
  const parsedError = icuSyntaxErrorSchema.safeParse(error);
  if (!parsedError.success) return String(error);
  const { message, location } = parsedError.data;
  return location === undefined
    ? message
    : `${message} at line ${location.start.line}, column ${location.start.column}`;
}

function formatArgumentNames(argumentNames: string[]): string {
  return argumentNames.length === 0 ? "none" : argumentNames.join(", ");
}
