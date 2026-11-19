import { screen } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@tests/helpers/render-with-intl";

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
// The avatar menu's next-intl navigation also needs the real `redirect`.
vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
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
    renderWithIntl(<Loading />, { locale: "lt" });
    expect(screen.getByRole("status")).toHaveTextContent("Įkeliama");
  });

  it("shows the section's error page", () => {
    vi.mocked(usePathname).mockReturnValue(`/lt/${segment}`);
    vi.mocked(useRouter).mockReturnValue(
      {} as unknown as ReturnType<typeof useRouter>,
    );
    renderWithIntl(<ErrorPage error={new Error("boom")} retry={vi.fn()} />, {
      locale: "lt",
    });

    expect(
      screen.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Kažkas nepavyko");
  });
});
