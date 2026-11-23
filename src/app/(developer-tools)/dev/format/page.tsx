import { NextIntlClientProvider } from "next-intl";

import { getFormat, getRequestTimeZone } from "@/lib/i18n/format/get-format";
import { LOCALE_NATIVE_NAMES, LOCALES } from "@/lib/i18n/locales";
import { MESSAGES } from "@/lib/i18n/messages";

import { ClientFormatSamples } from "./client-format-samples";
import { FormatSampleList } from "./format-sample-list";
import { getFormatSamples } from "./format-samples";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Formatting · Gym Tracker" };

/**
 * Formatting presets preview (E03-T03): every `getFormat()` preset rendered
 * on the server next to the same `useFormat()` presets in a client
 * component, in both locales. The server uses the time zone cookie (or
 * Europe/Vilnius before the browser has written it); the client lists use
 * the browser's zone after hydration. Used by tests/e2e/formatting.spec.ts
 * to check there's no hydration mismatch. Gated like every `/dev` page.
 */
export default async function FormatPage() {
  const [timeZone, serverSamples] = await Promise.all([
    getRequestTimeZone(),
    Promise.all(
      LOCALES.map(async (locale) => ({
        locale,
        samples: getFormatSamples(await getFormat({ locale })),
      })),
    ),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 py-8 lg:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Formatting</h1>
        <p className="text-muted-foreground">
          src/lib/i18n/format; time zone cookie: {timeZone}
        </p>
      </header>
      {serverSamples.map(({ locale, samples }) => {
        const languageName = LOCALE_NATIVE_NAMES[locale];
        return (
          <section
            key={locale}
            lang={locale}
            className="flex flex-col gap-4"
            aria-label={languageName}
          >
            <h2 className="text-xl font-semibold">{languageName}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormatSampleList
                label={`Server · ${locale}`}
                samples={samples}
              />
              {/* The cookie's zone, so the server render of the client list
                  already shows the user's times once the cookie is there. */}
              <NextIntlClientProvider
                locale={locale}
                messages={MESSAGES[locale]}
                timeZone={timeZone}
              >
                <ClientFormatSamples label={`Client · ${locale}`} />
              </NextIntlClientProvider>
            </div>
          </section>
        );
      })}
    </main>
  );
}
