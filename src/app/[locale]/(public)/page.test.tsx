import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@tests/helpers/render-with-intl";

import LandingPage from "./page";

// Example component test (E01-T04): render, then query the DOM the way a user
// (or screen reader) finds things — by role and accessible name.
describe("Landing placeholder page", () => {
  it("shows the app name as the main heading", () => {
    renderWithIntl(<LandingPage />, { locale: "en" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Gym Tracker" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Coming soon.")).toBeVisible();
    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
  });

  it("is translated into Lithuanian", () => {
    renderWithIntl(<LandingPage />, { locale: "lt" });

    expect(screen.getByText("Jau greitai.")).toBeVisible();
    expect(screen.getByRole("group", { name: "Tema" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Šviesi" })).toBeInTheDocument();
  });
});
