import { render, screen } from "@testing-library/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PageHeader } from "./page-header";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

const setLocale = (locale: string) => {
  vi.mocked(useParams).mockReturnValue({ locale });
  vi.mocked(usePathname).mockReturnValue(`/${locale}/sessions`);
};

describe("PageHeader", () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(
      {} as unknown as ReturnType<typeof useRouter>,
    );
    setLocale("en");
  });

  it("shows the title as the page heading and the avatar menu button, no back button on top-level pages", () => {
    render(<PageHeader title="Sessions" />);

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
    setLocale("lt");
    render(
      <PageHeader title="Antradienio treniruotė" backHref="/lt/sessions" />,
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
