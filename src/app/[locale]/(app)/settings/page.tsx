import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { getAppPath } from "@/components/common/app-shell/nav-items";
import { PageHeader } from "@/components/common/page/page-header";
import { getSectionMetadata } from "@/components/common/page/section-metadata";
import { AccountCard } from "@/features/settings/components/account-card";
import { PreferencesCard } from "@/features/settings/components/preferences-card";
import { SignOutButton } from "@/features/settings/components/sign-out-button";
import { YourDataCard } from "@/features/settings/components/your-data-card";
import { getSignInPath } from "@/lib/auth/auth-routes";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

export function generateMetadata() {
  return getSectionMetadata("settings");
}

/**
 * Settings (E04-T04): the account as Google provides it (read-only), the
 * language and theme saved to the profile, the data placeholders for
 * E10-T05, and sign out. Opened from the avatar menu; not a navigation
 * section, so the header has a back link to Home.
 */
export default async function SettingsPage() {
  const [locale, translateNav, profile] = await Promise.all([
    getLocale(),
    getTranslations("nav"),
    getCurrentProfile(),
  ]);
  // Only without a usable session (the proxy already requires sign-in), e.g.
  // a Clerk user without an email address, for whom no profile exists.
  if (!profile) redirect(getSignInPath(locale));

  return (
    <>
      <PageHeader
        title={translateNav("settings")}
        backHref={getAppPath(locale, "dashboard")}
      />
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <AccountCard
          name={profile.display_name}
          email={profile.email}
          avatarUrl={profile.avatar_url}
        />
        <PreferencesCard />
        <YourDataCard />
        <SignOutButton />
      </div>
    </>
  );
}
