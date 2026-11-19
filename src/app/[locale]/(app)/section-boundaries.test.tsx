import { render, screen } from "@testing-library/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import BuddiesError from "./buddies/error";
import BuddiesLoading from "./buddies/loading";
import HomeError from "./dashboard/error";
import HomeLoading from "./dashboard/loading";
import ProgressError from "./progress/error";
import ProgressLoading from "./progress/loading";
import SessionsError from "./sessions/error";
import SessionsLoading from "./sessions/loading";
import SettingsError from "./settings/error";
import SettingsLoading from "./settings/loading";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

// Every section has its own loading skeleton and translated error page.
describe.each([
  ["dashboard", HomeLoading, HomeError, "Pradžia"],
  ["sessions", SessionsLoading, SessionsError, "Treniruotės"],
  ["progress", ProgressLoading, ProgressError, "Pažanga"],
  ["buddies", BuddiesLoading, BuddiesError, "Draugai"],
  ["settings", SettingsLoading, SettingsError, "Nustatymai"],
])("%s", (segment, Loading, ErrorPage, title) => {
  it("shows the page skeleton while loading", () => {
    vi.mocked(useParams).mockReturnValue({ locale: "lt" });
    render(<Loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Įkeliama");
  });

  it("shows the section's error page", () => {
    vi.mocked(useParams).mockReturnValue({ locale: "lt" });
    vi.mocked(usePathname).mockReturnValue(`/lt/${segment}`);
    vi.mocked(useRouter).mockReturnValue(
      {} as unknown as ReturnType<typeof useRouter>,
    );
    render(<ErrorPage error={new Error("boom")} retry={vi.fn()} />);

    expect(
      screen.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Kažkas nepavyko");
  });
});
