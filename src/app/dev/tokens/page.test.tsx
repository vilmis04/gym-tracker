import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TokensPage from "./page";
import { COLOR_GROUPS, LITHUANIAN_SAMPLE } from "./token-catalog";

const renderTokensPage = async (query: Record<string, string> = {}) =>
  render(
    await TokensPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve(query),
    }),
  );

describe("/dev/tokens (design tokens preview)", () => {
  it("shows a swatch for every color token and the Lithuanian sample", async () => {
    await renderTokensPage();

    const allTokens = COLOR_GROUPS.flatMap((group) => group.swatches);
    for (const swatch of allTokens) {
      expect(screen.getByText(`--${swatch.token}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId("lithuanian-sample")).toHaveTextContent(
      LITHUANIAN_SAMPLE,
    );
  });

  it("renders in the light theme unless ?theme=dark", async () => {
    const { container, unmount } = await renderTokensPage({ theme: "dark" });
    expect(container.firstElementChild).toHaveClass("dark");
    expect(screen.getByRole("link", { name: "dark" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    unmount();

    const { container: fallbackContainer } = await renderTokensPage({
      theme: "neon",
    });
    expect(fallbackContainer.firstElementChild).toHaveClass("light");
    expect(fallbackContainer.firstElementChild).not.toHaveClass("dark");
  });
});
