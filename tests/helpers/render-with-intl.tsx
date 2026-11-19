import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { type ReactElement, type ReactNode } from "react";

import type { Locale } from "@/lib/i18n/i18n.types";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { MESSAGES } from "@/lib/i18n/messages";

/**
 * Renders a component that uses next-intl (`useTranslations`, `useLocale`)
 * with the real messages of `locale` (default `lt`, like the app), as the
 * `[locale]` layout's `NextIntlClientProvider` does. No mocking of next-intl
 * needed.
 */
export function renderWithIntl(
  ui: ReactElement,
  {
    locale = DEFAULT_LOCALE,
    ...renderOptions
  }: { locale?: Locale } & RenderOptions = {},
) {
  return render(ui, {
    wrapper: createIntlWrapper(locale),
    ...renderOptions,
  });
}

const createIntlWrapper = (locale: Locale) => {
  const IntlWrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone={TEST_TIME_ZONE}
    >
      {children}
    </NextIntlClientProvider>
  );
  return IntlWrapper;
};

// A fixed zone, so date output never depends on the machine running tests.
const TEST_TIME_ZONE = "Europe/Vilnius";
