import { NextIntlClientProvider } from "next-intl";
import { type ReactNode } from "react";

import { MESSAGES } from "@/lib/i18n/messages";

import { ROOT_VIEWPORT, RootDocument } from "../root-document";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "Gym Tracker" };

export const viewport: Viewport = ROOT_VIEWPORT;

/**
 * Root layout of the unlocalized developer pages (`/dev/*`, `/debug/error`;
 * E03-T01): they are English only, and the proxy skips them. The provider
 * lets the shared components they preview (ThemeToggle, NumberStepper)
 * read English messages and locale.
 */
export default function DeveloperToolsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RootDocument lang={DEVELOPER_TOOLS_LOCALE}>
      <NextIntlClientProvider
        locale={DEVELOPER_TOOLS_LOCALE}
        messages={MESSAGES[DEVELOPER_TOOLS_LOCALE]}
      >
        {children}
      </NextIntlClientProvider>
    </RootDocument>
  );
}

const DEVELOPER_TOOLS_LOCALE = "en";
