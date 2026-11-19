import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@tests/helpers/render-with-intl";

import TokensPage from "./page";
import { COLOR_GROUPS, LITHUANIAN_SAMPLE } from "./token-catalog";

describe("/dev/tokens (design tokens preview)", () => {
  it("shows a swatch for every color token and the Lithuanian sample", () => {
    renderWithIntl(<TokensPage />, { locale: "en" });

    const allTokens = COLOR_GROUPS.flatMap((group) => group.swatches);
    for (const swatch of allTokens) {
      expect(screen.getByText(`--${swatch.token}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId("lithuanian-sample")).toHaveTextContent(
      LITHUANIAN_SAMPLE,
    );
  });

  it("has the theme toggle for previewing both themes", () => {
    renderWithIntl(<TokensPage />, { locale: "en" });

    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
  });
});
