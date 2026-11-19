/** A messages file: nested groups (namespaces) whose leaves are ICU messages. */
export type MessageTree = { [key: string]: string | MessageTree };

export type MessageCatalog = {
  /** As shown in the report, e.g. "messages/lt.json". */
  fileName: string;
  /** BCP 47 locale whose plural categories the messages must cover, e.g. "lt". */
  locale: string;
  messages: MessageTree;
};

export type MessageProblem = {
  fileName: string;
  /** Dot-separated path from the file's root, e.g. "counts.sets". */
  keyPath: string;
  description: string;
};
