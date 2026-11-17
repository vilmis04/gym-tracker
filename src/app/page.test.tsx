import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

// Example component test (E01-T04): render, then query the DOM the way a user
// (or screen reader) finds things — by role and accessible name.
describe("Home placeholder page", () => {
  it("shows the app name as the main heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Gym Tracker" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Coming soon.")).toBeVisible();
  });
});
