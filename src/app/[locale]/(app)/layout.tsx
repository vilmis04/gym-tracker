import { AppShell } from "@/components/common/app-shell/app-shell";

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
 */
export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return <AppShell>{children}</AppShell>;
}
