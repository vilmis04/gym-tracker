import { Suspense } from "react";

import { AppShell } from "@/components/common/app-shell/app-shell";
import { EnsureProfile } from "@/components/common/auth/ensure-profile";
import { PreferenceSaveToast } from "@/components/common/preferences/preference-save-toast";

/**
 * Layout of the signed-in area (`/[locale]/dashboard`, `/sessions`, …):
 * the app shell with the bottom navigation / sidebar (E02-T06). The locale,
 * `<html lang>`, title template and messages come from the `[locale]` root
 * layout (E03-T01).
 *
 * Signed-out requests never reach it: the proxy (`src/proxy.ts`, E04-T01)
 * sends every page of this group to sign-in. No auth check here on purpose:
 * a layout isn't re-run on client navigation (Next.js authentication guide);
 * data is checked where it is read (RLS with the Clerk token, E04-T02).
 *
 * `EnsureProfile` (E04-T03) creates the user's profile on their first visit
 * to the signed-in area if the Clerk webhook hasn't yet; it renders when the
 * layout enters the tree (right after sign-in), not on every navigation.
 * It also applies the profile's saved language and theme once per sign-in
 * (`ApplySavedPreferences`, E04-T04). `PreferenceSaveToast` confirms saving
 * a language or theme change from the avatar menu or the settings page.
 */
export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <EnsureProfile />
      </Suspense>
      <PreferenceSaveToast />
      {children}
    </AppShell>
  );
}
