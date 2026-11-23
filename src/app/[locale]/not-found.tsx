import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { getAppPath } from "@/components/common/app-shell/nav-items";
import { Button } from "@/components/ui/button";

/**
 * The localized 404 (E03-T01) for `notFound()` anywhere under `/[locale]`
 * and for unknown paths such as `/lt/nothing-here` (`[...unknownPath]`).
 */
export default async function LocaleNotFound() {
  const [locale, translateErrors, translateNav] = await Promise.all([
    getLocale(),
    getTranslations("errors"),
    getTranslations("nav"),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-semibold">
        {translateErrors("pageNotFoundTitle")}
      </h1>
      <p className="max-w-xs text-base text-muted-foreground">
        {translateErrors("notFound")}
      </p>
      <Button variant="secondary" asChild>
        <Link href={getAppPath(locale, "dashboard")}>
          {translateNav("home")}
        </Link>
      </Button>
    </main>
  );
}
