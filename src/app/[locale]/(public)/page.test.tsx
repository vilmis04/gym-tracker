import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@tests/helpers/render-with-intl";
import { stubAppRouterAt } from "@tests/helpers/stub-app-router";

import LandingPage from "./page";

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

// Example component test (E01-T04): render, then query the DOM the way a user
// (or screen reader) finds things — by role and accessible name.
describe("Landing placeholder page", () => {
  beforeEach(() => {
    stubAppRouterAt("/lt");
  });

  it("shows the app name as the main heading, sign-in and both switches", () => {
    renderWithIntl(<LandingPage />, { locale: "en" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Gym Tracker" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Coming soon.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/en/sign-in",
    );
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
  });

  it("is translated into Lithuanian", () => {
    renderWithIntl(<LandingPage />, { locale: "lt" });

    expect(screen.getByText("Jau greitai.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Prisijungti" })).toHaveAttribute(
      "href",
      "/lt/sign-in",
    );
    expect(screen.getByRole("group", { name: "Kalba" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Tema" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Šviesi" })).toBeInTheDocument();
  });
});
