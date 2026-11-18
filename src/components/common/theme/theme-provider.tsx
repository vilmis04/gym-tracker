"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

import { ThemeColorSync } from "./theme-color-sync";
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_STORAGE_KEY,
} from "./theme-preferences";

/**
 * Light / dark / system theme for the whole app (E02-T02). next-themes renders
 * an inline script that sets the `dark` or `light` class on <html> from local
 * storage (or the OS setting) while the HTML is parsed, so the first paint is
 * already in the right theme. <html> needs `suppressHydrationWarning` because
 * that script changes its class before React hydrates.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME_PREFERENCE}
      storageKey={THEME_STORAGE_KEY}
      enableSystem
      disableTransitionOnChange
    >
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  );
}
