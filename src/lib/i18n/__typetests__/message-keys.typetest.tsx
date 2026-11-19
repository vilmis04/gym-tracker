/**
 * Type-level test for type-safe message keys (E03-T01 acceptance criterion:
 * "using a key that doesn't exist fails typecheck"). Checked by
 * `npm run typecheck`; never rendered or bundled (nothing imports it and it
 * lives outside `src/app`). The `@ts-expect-error` lines lock in that unknown
 * namespaces and keys are errors: if the `AppConfig` augmentation in
 * `src/global.d.ts` ever stopped applying, they would stop erroring and
 * typecheck would fail.
 */
import { useLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import type { Locale } from "../i18n.types";

export function ClientComponentKeys() {
  const translate = useTranslations("nav");
  const locale: Locale = useLocale();

  // @ts-expect-error -- "missing" is not a key of the `nav` namespace.
  translate("missing");
  // @ts-expect-error -- there is no `nope` namespace.
  useTranslations("nope");

  return <p lang={locale}>{translate("sessions")}</p>;
}

export async function ServerComponentKeys() {
  const translate = await getTranslations("errors");

  // @ts-expect-error -- "missing" is not a key of the `errors` namespace.
  translate("missing");
  // @ts-expect-error -- there is no `nope` namespace.
  await getTranslations("nope");
  // @ts-expect-error -- "de" is not a supported locale.
  await getTranslations({ locale: "de", namespace: "errors" });

  return <p>{translate("notFound")}</p>;
}
