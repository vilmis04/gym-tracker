import { type z } from "zod";

import { type localeSchema } from "./locales";

import type enMessages from "../../../messages/en.json";

export type Locale = z.infer<typeof localeSchema>;

export type MessageNamespace = keyof typeof enMessages;

export type MessageKey<Namespace extends MessageNamespace> =
  keyof (typeof enMessages)[Namespace] & string;

/**
 * The message tree: namespaces of flat `key → text` maps, keyed like
 * `messages/en.json` (the reference; `lt.json` must have the same keys).
 */
export type Messages = {
  [Namespace in MessageNamespace]: Record<MessageKey<Namespace>, string>;
};
