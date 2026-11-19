import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TokensPage from "./page";
import { COLOR_GROUPS, LITHUANIAN_SAMPLE } from "./token-catalog";

describe("/dev/tokens (design tokens preview)", () => {
  it("shows a swatch for every color token and the Lithuanian sample", () => {
    render(<TokensPage />);

    const allTokens = COLOR_GROUPS.flatMap((group) => group.swatches);
    for (const swatch of allTokens) {
      expect(screen.getByText(`--${swatch.token}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId("lithuanian-sample")).toHaveTextContent(
      LITHUANIAN_SAMPLE,
    );
  });

  it("has the theme toggle for previewing both themes", () => {
    render(<TokensPage />);

    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
  });
});
