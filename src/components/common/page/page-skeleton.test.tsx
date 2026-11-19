import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@tests/helpers/render-with-intl";

import { PageSkeleton } from "./page-skeleton";

describe("PageSkeleton", () => {
  it.each([
    ["en", "Loading"],
    ["lt", "Įkeliama"],
  ] as const)(
    "is a busy region that announces loading once (%s)",
    (locale, text) => {
      const { container } = renderWithIntl(<PageSkeleton />, { locale });

      expect(screen.getByRole("status")).toHaveTextContent(text);
      expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
      // The placeholder blocks are hidden from screen readers.
      expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(6);
    },
  );
});
