import type { Locale } from "@/lib/i18n/i18n.types";

import type { LocalizationResource } from "@clerk/nextjs/types";

/**
 * Texts of Clerk's components (`<SignIn />`) per app locale, passed to
 * `<ClerkProvider localization>` (E04-T01).
 *
 * - English is Clerk's built-in text, so only the locale is set: importing
 *   `enUS` from `@clerk/localizations` would add ~100 kB to every page.
 * - Clerk ships no Lithuanian (`@clerk/localizations` has no `ltLT`), so the
 *   strings of the Google-only sign-in-or-up flow and of the account
 *   management dialog a Google-only user sees (E04-T04) are translated here. Clerk
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
    // Account management (`openUserProfile()`, settings page, E04-T04):
    // the screens a Google-only user reaches. Account deletion is left out
    // on purpose: it stays off in the Clerk dashboard until E10-T05
    // (docs/deployment.md → Clerk).
    formFieldLabel__firstName: "Vardas",
    formFieldLabel__lastName: "Pavardė",
    badge__primary: "Pagrindinis",
    badge__thisDevice: "Šis įrenginys",
    badge__unverified: "Nepatvirtintas",
    userProfile: {
      mobileButton__menu: "Meniu",
      formButtonPrimary__continue: "Tęsti",
      formButtonPrimary__save: "Išsaugoti",
      formButtonPrimary__finish: "Baigti",
      formButtonPrimary__remove: "Pašalinti",
      formButtonPrimary__add: "Pridėti",
      formButtonReset: "Atšaukti",
      navbar: {
        title: "Paskyra",
        description: "Tvarkykite savo paskyros informaciją.",
        account: "Profilis",
        security: "Saugumas",
      },
      start: {
        headerTitle__account: "Profilio informacija",
        headerTitle__security: "Saugumas",
        profileSection: {
          title: "Profilis",
          primaryButton: "Atnaujinti profilį",
        },
        emailAddressesSection: {
          title: "El. pašto adresai",
          primaryButton: "Pridėti el. pašto adresą",
          detailsAction__primary: "Baigti patvirtinimą",
          detailsAction__nonPrimary: "Padaryti pagrindiniu",
          detailsAction__unverified: "Patvirtinti",
          destructiveAction: "Pašalinti el. pašto adresą",
        },
        connectedAccountsSection: {
          title: "Susietos paskyros",
          primaryButton: "Susieti paskyrą",
          actionLabel__connectionFailed: "Bandyti dar kartą",
          subtitle__disconnected: "Ši paskyra atjungta.",
          destructiveActionTitle: "Pašalinti",
        },
        activeDevicesSection: {
          title: "Aktyvūs įrenginiai",
          destructiveAction: "Atsijungti iš įrenginio",
        },
      },
      profilePage: {
        title: "Atnaujinti profilį",
        imageFormTitle: "Profilio nuotrauka",
        imageFormSubtitle: "Įkelti",
        imageFormDestructiveActionSubtitle: "Pašalinti",
        fileDropAreaHint: "Rekomenduojamas santykis 1:1, iki 10 MB.",
        readonly:
          "Jūsų profilio informaciją pateikia įmonės ryšys, jos keisti negalima.",
        successMessage: "Profilis atnaujintas.",
      },
      connectedAccountPage: {
        title: "Susieti paskyrą",
        formHint: "Pasirinkite paslaugų teikėją, kurio paskyrą norite susieti.",
        formHint__noAccounts: "Nėra galimų išorinių paskyrų teikėjų.",
        socialButtonsBlockButton: "Susieti {{provider|titleize}} paskyrą",
        successMessage: "Paslaugų teikėjas pridėtas prie jūsų paskyros.",
        removeResource: {
          title: "Pašalinti susietą paskyrą",
          messageLine1: "{{identifier}} bus pašalinta iš šios paskyros.",
          messageLine2:
            "Nebegalėsite naudotis šia susieta paskyra ir su ja susijusios funkcijos nebeveiks.",
          successMessage: "{{connectedAccount}} pašalinta iš jūsų paskyros.",
        },
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
