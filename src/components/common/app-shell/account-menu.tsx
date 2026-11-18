"use client";

import { Monitor, Moon, Settings, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useMemo } from "react";

import { themePreferenceSchema } from "@/components/common/theme/theme-preferences";
import { useThemePreference } from "@/components/common/theme/use-theme-preference";
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
import {
  getLocalizedPathname,
  LOCALE_NATIVE_NAMES,
  LOCALES,
  localeSchema,
} from "@/lib/i18n/locales";
import { useLocale, useTranslations } from "@/lib/i18n/use-translations";

import { getAppPath } from "./nav-items";

/**
 * The avatar menu in the page header (E02-T06): language, theme and
 * settings. A Radix menu, so Enter / Space / ↓ open it, the arrow keys move
 * through every item (the language and theme choices are menu radio items),
 * Esc closes it and focus returns to the button.
 *
 * Picking a language opens the same page in that language; picking a theme
 * applies it at once and keeps the menu open, so the user can compare.
 */
export function AccountMenu() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const translateCommon = useTranslations("common");
  const translateNav = useTranslations("nav");
  // TODO(E04-T04): pass `onThemePreferenceChange` to save it to profiles.theme.
  const { themePreference, setThemePreference } = useThemePreference();
  const languageLabelId = useId();
  const themeLabelId = useId();

  const handleLocaleChange = (value: string) => {
    const parsedLocale = localeSchema.safeParse(value);
    if (!parsedLocale.success || parsedLocale.data === locale) return;
    // TODO(E03-T02): keep the query string and save the NEXT_LOCALE cookie
    // (and profiles.locale) through the LanguageSwitcher.
    router.replace(getLocalizedPathname(pathname, parsedLocale.data));
  };

  const handleThemeChange = (value: string) => {
    const parsedTheme = themePreferenceSchema.safeParse(value);
    if (parsedTheme.success) setThemePreference(parsedTheme.data);
  };

  const themeOptions = useMemo(
    () =>
      [
        { value: "light", label: translateCommon("themeLight"), Icon: Sun },
        { value: "dark", label: translateCommon("themeDark"), Icon: Moon },
        {
          value: "system",
          label: translateCommon("themeSystem"),
          Icon: Monitor,
        },
      ] as const,
    [translateCommon],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* TODO(E04): show the signed-in user's <Avatar size="lg" /> here. */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={translateCommon("accountMenu")}
          className="bg-surface text-muted-foreground"
        >
          <UserRound aria-hidden="true" size={20} strokeWidth={1.5} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
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
        {/* TODO(E04-T01): add "Sign out" (Clerk) as the last item. */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const keepMenuOpen = (event: Event) => {
  event.preventDefault();
};
