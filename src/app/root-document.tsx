import { Inter } from "next/font/google";
import { type ReactNode } from "react";

import { ThemeProvider } from "@/components/common/theme/theme-provider";
import { Toaster } from "@/components/ui/toast";

import type { Viewport } from "next";

import "./globals.css";

// `latin-ext` carries the Lithuanian letters (ą č ę ė į š ų ū ž); without it
// they would render in the fallback font. Inter is variable, so no weights.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * `viewport` of every root layout. `viewport-fit=cover` lets the page draw
 * under the iPhone notch and home indicator and makes
 * `env(safe-area-inset-*)` non-zero, which the bottom navigation and the
 * full-height Sheet pad themselves with.
 */
export const ROOT_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * The `<html>` / `<body>` shared by the app's two root layouts (E03-T01):
 * `app/[locale]/layout.tsx` (every localized page) and
 * `app/(developer-tools)/layout.tsx` (`/dev`, `/debug`). There is no
 * `app/layout.tsx`, because the locale must be a root param.
 */
export function RootDocument({
  lang,
  children,
}: {
  lang: string;
  children: ReactNode;
}) {
  return (
    // suppressHydrationWarning: the theme script sets the class (and
    // color-scheme) on <html> before React hydrates (see ThemeProvider).
    <html
      lang={lang}
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {children}
          {/* Once for the whole app, so any page can call showToast(). */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
