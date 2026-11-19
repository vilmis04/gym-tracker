"use client";

import { useEffect } from "react";

/**
 * Keeps `<meta name="theme-color">` (the browser UI color on mobile) equal to
 * the page background of the active theme. The color is read from the
 * rendered `--background` token instead of being repeated here, so
 * src/app/globals.css stays the only place colors are defined.
 *
 * The inline script sets it while the HTML is parsed (it comes after the
 * next-themes script, and inline scripts wait for the stylesheets before
 * them), so the browser UI is right before hydration; afterwards a
 * MutationObserver follows every class change on <html>.
 */
export function ThemeColorSync() {
  useEffect(() => {
    updateThemeColorMeta();
    const observer = new MutationObserver(updateThemeColorMeta);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <script
      // Only the server-rendered script runs; React would warn about a script
      // element created on the client, so it is inert there.
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_COLOR_SCRIPT }}
    />
  );
}

// Self-contained (no imports or outer variables): it is serialized with
// toString() into the inline script.
const updateThemeColorMeta = () => {
  const existingMeta = document.querySelector('meta[name="theme-color"]');
  const meta = existingMeta ?? document.createElement("meta");
  if (!existingMeta) {
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", getComputedStyle(document.body).backgroundColor);
};

const THEME_COLOR_SCRIPT = `(${updateThemeColorMeta.toString()})()`;
