import type { NextClerkProviderProps } from "@clerk/nextjs/types";

/**
 * Clerk's components in the app's design tokens (E04-T01). The values are
 * the CSS custom properties from `src/app/globals.css`, not colors: Clerk
 * derives its shades from them with `color-mix()` in the browser, so the
 * sign-in card follows the light / dark theme (the `.dark` class on
 * `<html>`) without re-rendering. No shadow, as cards in the app use fills
 * only (docs/design-system.md → Elevation).
 */
export const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: "var(--primary)",
    colorPrimaryForeground: "var(--primary-foreground)",
    colorForeground: "var(--foreground)",
    colorMutedForeground: "var(--muted-foreground)",
    colorMuted: "var(--muted)",
    colorBackground: "var(--card)",
    colorInput: "var(--background)",
    colorInputForeground: "var(--foreground)",
    colorBorder: "var(--border)",
    colorNeutral: "var(--foreground)",
    colorRing: "var(--ring)",
    colorDanger: "var(--destructive)",
    colorSuccess: "var(--success)",
    colorWarning: "var(--warning)",
    colorModalBackdrop: "var(--scrim)",
    colorShadow: "transparent",
    // `--radius-md` (12 px), the app's control radius.
    borderRadius: "0.75rem",
    // Inter from the root layout (`--font-inter`).
    fontFamily: "inherit",
    fontFamilyButtons: "inherit",
  },
} as const satisfies NextClerkProviderProps["appearance"];
