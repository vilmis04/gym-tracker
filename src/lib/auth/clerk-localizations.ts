import type { Locale } from "@/lib/i18n/i18n.types";

import type { LocalizationResource } from "@clerk/nextjs/types";

/**
 * Texts of Clerk's components (`<SignIn />`) per app locale, passed to
 * `<ClerkProvider localization>` (E04-T01).
 *
 * - English is Clerk's built-in text, so only the locale is set: importing
 *   `enUS` from `@clerk/localizations` would add ~100 kB to every page.
 * - Clerk ships no Lithuanian (`@clerk/localizations` has no `ltLT`), so the
 *   strings of the Google-only sign-in-or-up flow are translated here. Clerk
 *   falls back to English for any key left out (screens this app never shows:
 *   passwords, phone codes, organizations, billing). The values use Clerk's
 *   `{{placeholder}}` syntax, not ICU, which is why they aren't in
 *   `messages/*.json`.
 */
export const CLERK_LOCALIZATIONS = {
  en: { locale: "en-US" },
  lt: {
    locale: "lt-LT",
    backButton: "Atgal",
    dividerText: "arba",
    formButtonPrimary: "Tęsti",
    socialButtonsBlockButton: "Tęsti su {{provider|titleize}}",
    socialButtonsBlockButtonManyInView: "{{provider|titleize}}",
    lastAuthenticationStrategy: "Naudota paskutinį kartą",
    footerPageLink__help: "Pagalba",
    footerPageLink__privacy: "Privatumas",
    footerPageLink__terms: "Sąlygos",
    maintenanceMode:
      "Šiuo metu atliekami priežiūros darbai. Tai neturėtų užtrukti ilgiau nei kelias minutes.",
    signIn: {
      start: {
        title: "Prisijunkite prie {{applicationName}}",
        titleCombined: "Tęskite į {{applicationName}}",
        subtitle: "Sveiki sugrįžę! Prisijunkite, kad tęstumėte",
        actionText: "Neturite paskyros?",
        actionLink: "Užsiregistruoti",
      },
      accountSwitcher: {
        title: "Pasirinkite paskyrą",
        subtitle: "Pasirinkite paskyrą, su kuria norite tęsti.",
        action__addAccount: "Pridėti paskyrą",
        action__signOutAll: "Atsijungti nuo visų paskyrų",
      },
      noAvailableMethods: {
        title: "Nepavyko prisijungti",
        subtitle: "Įvyko klaida",
        message: "Prisijungti negalima: nėra galimo prisijungimo būdo.",
      },
      protectCheck: {
        title: "Tikriname jūsų užklausą",
        subtitle: "Palaukite, kol patikrinsime jūsų užklausą.",
        loading: "Įkeliama…",
        retryButton: "Bandyti dar kartą",
      },
    },
    signUp: {
      start: {
        title: "Susikurkite paskyrą",
        titleCombined: "Susikurkite paskyrą",
        subtitle: "Sveiki! Užpildykite duomenis, kad pradėtumėte.",
        subtitleCombined: "Sveiki! Užpildykite duomenis, kad pradėtumėte.",
        actionText: "Jau turite paskyrą?",
        actionLink: "Prisijungti",
      },
      continue: {
        title: "Užpildykite trūkstamus laukus",
        subtitle: "Užpildykite likusius duomenis, kad tęstumėte.",
        actionText: "Jau turite paskyrą?",
        actionLink: "Prisijungti",
      },
    },
    unstable__errors: {
      oauth_access_denied: "Nesuteikėte prieigos prie savo paskyros.",
      action_blocked:
        "Šio veiksmo atlikti nepavyko. Bandykite vėliau arba susisiekite su pagalba, jei tai kartojasi.",
      captcha_unavailable:
        "Nepavyko patikrinti, ar nesate robotas. Atnaujinkite puslapį ir bandykite dar kartą.",
    },
  },
} as const satisfies Record<Locale, LocalizationResource>;
