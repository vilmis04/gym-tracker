import { render, screen, within } from "@testing-library/react";
import { useParams, usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BottomNav, SidebarNav } from "./main-nav";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  usePathname: vi.fn(),
}));

const setRoute = (locale: string, pathname: string) => {
  vi.mocked(useParams).mockReturnValue({ locale });
  vi.mocked(usePathname).mockReturnValue(pathname);
};

describe.each([
  ["BottomNav", BottomNav],
  ["SidebarNav", SidebarNav],
])("%s", (_name, Nav) => {
  beforeEach(() => {
    setRoute("en", "/en/sessions/123");
  });

  it("links the four sections in order, without count badges", () => {
    render(<Nav />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const links = within(nav).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Home",
      "Sessions",
      "Progress",
      "Buddies",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/en/dashboard",
      "/en/sessions",
      "/en/progress",
      "/en/buddies",
    ]);
  });

  it("marks the section of a detail page as the current page", () => {
    render(<Nav />);

    expect(screen.getByRole("link", { name: "Sessions" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const name of ["Home", "Progress", "Buddies"]) {
      expect(screen.getByRole("link", { name })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });

  it("marks nothing on a page outside the four sections", () => {
    setRoute("en", "/en/settings");
    render(<Nav />);

    expect(
      screen
        .getAllByRole("link")
        .filter((link) => link.hasAttribute("aria-current")),
    ).toEqual([]);
  });

  it("is translated into Lithuanian", () => {
    setRoute("lt", "/lt/progress");
    render(<Nav />);

    const nav = screen.getByRole("navigation", { name: "Pagrindinė" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Pradžia", "Treniruotės", "Pažanga", "Draugai"]);
    expect(screen.getByRole("link", { name: "Pažanga" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
