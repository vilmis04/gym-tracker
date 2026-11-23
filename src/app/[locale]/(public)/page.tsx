import { Dumbbell } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/common/language/language-switcher";
import { ThemeToggle } from "@/components/common/theme/theme-toggle";
import { BenefitList } from "@/features/landing/components/benefit-list";
import { ContinueWithGoogle } from "@/features/landing/components/continue-with-google";
import {
  getLandingOpenGraphImagePath,
  LANDING_OPEN_GRAPH_IMAGE_SIZE,
} from "@/features/landing/open-graph/landing-open-graph-image-route";
import { getLandingPath } from "@/lib/auth/auth-routes";
import type { Locale } from "@/lib/i18n/i18n.types";
import { LOCALES } from "@/lib/i18n/locales";
import { getSiteUrl } from "@/lib/seo/site-url";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, translateCommon, translateLanding] = await Promise.all([
    getLocale(),
    getTranslations("common"),
    getTranslations("landing"),
  ]);
  const title = translateLanding("metaTitle");
  const description = translateLanding("metaDescription");
  // Links to this host only make sense once the real one is known.
  const isSiteUrlKnown = getSiteUrl() !== undefined;
  const image = {
    url: getLandingOpenGraphImagePath(locale),
    ...LANDING_OPEN_GRAPH_IMAGE_SIZE,
    alt: translateLanding("ogImageAlt"),
    type: "image/png",
  };

  return {
    title: { absolute: title },
    description,
    openGraph: {
      type: "website",
      siteName: translateCommon("appName"),
      title,
      description,
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: LOCALES.filter(
        (otherLocale) => otherLocale !== locale,
      ).map((otherLocale) => OPEN_GRAPH_LOCALES[otherLocale]),
      url: isSiteUrlKnown ? getLandingPath(locale) : undefined,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: isSiteUrlKnown
      ? {
          canonical: getLandingPath(locale),
          languages: {
            ...Object.fromEntries(
              LOCALES.map((alternateLocale) => [
                alternateLocale,
                getLandingPath(alternateLocale),
              ]),
            ),
            // "/" opens in the visitor's language (cookie, then browser).
            "x-default": "/",
          },
        }
      : undefined,
  };
}

/**
 * Public landing page (E04-T05) for signed-out visitors; signed-in users
 * are sent to Home by the proxy (`src/proxy.ts`), so this page stays
 * prerendered per locale. App name, one-line value proposition, "Continue
 * with Google" (the one primary action, right below it so it is in view on
 * a phone), three benefits, then the language and theme switches. The
 * switches only change this device: nobody is signed in to save them for,
 * and after signing in a brand-new profile takes these choices
 * (`ApplySavedPreferences`).
 */
export default function LandingPage() {
  const translateCommon = useTranslations("common");
  const translateLanding = useTranslations("landing");

  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-[calc(2.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))] lg:px-6 lg:pt-16">
      <div className="flex w-full max-w-md flex-1 flex-col gap-10 lg:max-w-4xl">
        <header className="flex flex-col items-center gap-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Dumbbell aria-hidden="true" size={28} strokeWidth={1.5} />
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {translateCommon("appName")}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {translateLanding("valueProposition")}
            </p>
          </div>
          <ContinueWithGoogle />
        </header>

        <section aria-labelledby={BENEFITS_TITLE_ID}>
          <h2 id={BENEFITS_TITLE_ID} className="sr-only">
            {translateLanding("benefitsTitle")}
          </h2>
          <BenefitList />
        </section>

        <section
          aria-labelledby={PREFERENCES_TITLE_ID}
          className="mt-auto flex flex-col items-center gap-4"
        >
          <h2 id={PREFERENCES_TITLE_ID} className="sr-only">
            {translateLanding("preferencesTitle")}
          </h2>
          <LanguageSwitcher />
          <ThemeToggle />
        </section>
      </div>
    </main>
  );
}

const BENEFITS_TITLE_ID = "landing-benefits-title";

const PREFERENCES_TITLE_ID = "landing-preferences-title";

// Open Graph wants language_TERRITORY.
const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  lt: "lt_LT",
  en: "en_US",
};
