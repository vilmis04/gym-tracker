"use client";

import { useEffect } from "react";

/**
 * While `isEnabled`, keeps `--visual-viewport-height` and
 * `--visual-viewport-top` on `<html>` in sync with `window.visualViewport`.
 * iOS Safari doesn't resize the layout viewport (or `dvh`) for the on-screen
 * keyboard; only the visual viewport shrinks, so a fixed panel sized from
 * these variables stays above the keyboard instead of under it.
 */
export function useVisualViewportVariables(isEnabled: boolean) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!isEnabled || !viewport) return;

    const rootStyle = document.documentElement.style;
    const updateVariables = () => {
      rootStyle.setProperty(VIEWPORT_HEIGHT_VARIABLE, `${viewport.height}px`);
      rootStyle.setProperty(VIEWPORT_TOP_VARIABLE, `${viewport.offsetTop}px`);
    };

    updateVariables();
    viewport.addEventListener("resize", updateVariables);
    viewport.addEventListener("scroll", updateVariables);
    return () => {
      viewport.removeEventListener("resize", updateVariables);
      viewport.removeEventListener("scroll", updateVariables);
      rootStyle.removeProperty(VIEWPORT_HEIGHT_VARIABLE);
      rootStyle.removeProperty(VIEWPORT_TOP_VARIABLE);
    };
  }, [isEnabled]);
}

const VIEWPORT_HEIGHT_VARIABLE = "--visual-viewport-height";
const VIEWPORT_TOP_VARIABLE = "--visual-viewport-top";
