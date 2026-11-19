import { screen } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@tests/helpers/render-with-intl";

import { PageHeader } from "./page-header";

// The avatar menu's next-intl navigation also needs the real `redirect`.
vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

describe("PageHeader", () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(
      {} as unknown as ReturnType<typeof useRouter>,
    );
    vi.mocked(usePathname).mockReturnValue("/en/sessions");
  });

  it("shows the title as the page heading and the avatar menu button, no back button on top-level pages", () => {
    renderWithIntl(<PageHeader title="Sessions" />, { locale: "en" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Sessions" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Account, language and theme" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Back" }),
    ).not.toBeInTheDocument();
  });

  it("shows a translated back link on detail pages", () => {
    vi.mocked(usePathname).mockReturnValue("/lt/sessions/123");
    renderWithIntl(
      <PageHeader title="Antradienio treniruotė" backHref="/lt/sessions" />,
      { locale: "lt" },
    );

    expect(screen.getByRole("link", { name: "Atgal" })).toHaveAttribute(
      "href",
      "/lt/sessions",
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Antradienio treniruotė" }),
    ).toBeVisible();
  });
});
