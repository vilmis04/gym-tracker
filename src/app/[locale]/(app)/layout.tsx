import { AppShell } from "@/components/common/app-shell/app-shell";

/**
 * Layout of the signed-in area (`/[locale]/dashboard`, `/sessions`, …):
 * the app shell with the bottom navigation / sidebar (E02-T06). The locale,
 * `<html lang>`, title template and messages come from the `[locale]` root
 * layout (E03-T01).
 */
export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  // TODO(E04-T01): the auth gate goes here. Clerk's middleware protects every
  // (app) route; until then these placeholder pages are public.

  return <AppShell>{children}</AppShell>;
}
