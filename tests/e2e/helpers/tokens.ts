import type { Page } from "@playwright/test";

/** Resolves a design token to the computed `rgb()` value the browser uses. */
export const getTokenColor = (page: Page, token: string) =>
  page.evaluate((cssVariable) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${cssVariable})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
