"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId, useMemo } from "react";

import { useAccount } from "@/components/common/auth/account-context";
import { useLocaleSwitch } from "@/components/common/language/use-locale-switch";
import {
  saveLocaleToProfile,
  saveThemeToProfile,
} from "@/components/common/preferences/preference-saving";
import {
  THEME_PREFERENCE_OPTIONS,
  THEME_PREFERENCES,
  themePreferenceSchema,
} from "@/components/common/theme/theme-preferences";
import { useThemePreference } from "@/components/common/theme/use-theme-preference";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLandingPath } from "@/lib/auth/auth-routes";
import { LOCALE_NATIVE_NAMES, LOCALES, localeSchema } from "@/lib/i18n/locales";

import { getAppPath } from "./nav-items";

/**
 * The avatar menu in the page header (E02-T06): the signed-in user's avatar
 * on the button, their name and email, language, theme, settings and sign
 * out (E04-T01). A Radix menu, so Enter / Space / ↓ open it, the arrow keys move
 * through every item (the language and theme choices are menu radio items),
 * Esc closes it and focus returns to the button.
 *
 * Picking a language opens the same page (query included) in that language
 * and remembers it in the `NEXT_LOCALE` cookie, like the `LanguageSwitcher`
 * on the landing page; picking a theme applies it at once and keeps the menu
 * open, so the user can compare. Once the user is loaded, both choices are
 * also saved to their profile (E04-T04), which follows them to other
 * devices; `PreferenceSaveToast` confirms it. Signing out ends the Clerk
 * session and opens the landing page.
 */
export function AccountMenu() {
  const account = useAccount();
  const isSignedIn = account !== null;
  const { locale, switchLocale } = useLocaleSwitch({
    onLocaleChange: isSignedIn ? saveLocaleToProfile : undefined,
  });
  const translateCommon = useTranslations("common");
  const translateNav = useTranslations("nav");
  const { themePreference, setThemePreference } = useThemePreference({
    onThemePreferenceChange: isSignedIn ? saveThemeToProfile : undefined,
  });
  const translateAuth = useTranslations("auth");
  const languageLabelId = useId();
  const themeLabelId = useId();

  const handleLocaleChange = (value: string) => {
    const parsedLocale = localeSchema.safeParse(value);
    if (parsedLocale.success) switchLocale(parsedLocale.data);
  };

  const handleThemeChange = (value: string) => {
    const parsedTheme = themePreferenceSchema.safeParse(value);
    if (parsedTheme.success) setThemePreference(parsedTheme.data);
  };

  const handleSignOut = () => {
    void account?.signOut(getLandingPath(locale));
  };

  const themeOptions = useMemo(
    () =>
      THEME_PREFERENCES.map((preference) => {
        const { labelKey, Icon } = THEME_PREFERENCE_OPTIONS[preference];
        return { value: preference, label: translateCommon(labelKey), Icon };
      }),
    [translateCommon],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={translateCommon("accountMenu")}
          className="bg-surface text-muted-foreground"
        >
          {/* The icon until Clerk has loaded the user in the browser. */}
          {account ? (
            <Avatar
              name={account.user.name}
              imageUrl={account.user.imageUrl}
              size="lg"
              isDecorative
            />
          ) : (
            <UserRound aria-hidden="true" size={20} strokeWidth={1.5} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {account && (
          <>
            <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
              <span className="truncate text-base font-semibold text-popover-foreground">
                {account.user.name}
              </span>
              {account.user.email !== null && (
                <span className="truncate">{account.user.email}</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel id={languageLabelId}>
          {translateCommon("language")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          aria-labelledby={languageLabelId}
          value={locale}
          onValueChange={handleLocaleChange}
        >
          {LOCALES.map((optionLocale) => (
            <DropdownMenuRadioItem
              key={optionLocale}
              value={optionLocale}
              lang={optionLocale}
            >
              {LOCALE_NATIVE_NAMES[optionLocale]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel id={themeLabelId}>
          {translateCommon("theme")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          aria-labelledby={themeLabelId}
          value={themePreference ?? ""}
          onValueChange={handleThemeChange}
        >
          {themeOptions.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              onSelect={keepMenuOpen}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={getAppPath(locale, "settings")}>
            <Settings aria-hidden="true" size={20} strokeWidth={1.5} />
            {translateNav("settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!isSignedIn} onSelect={handleSignOut}>
          <LogOut aria-hidden="true" size={20} strokeWidth={1.5} />
          {translateAuth("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const keepMenuOpen = (event: Event) => {
  event.preventDefault();
};
