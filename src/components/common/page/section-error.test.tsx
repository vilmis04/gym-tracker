import * as Sentry from "@sentry/nextjs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams, usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SectionError } from "./section-error";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

const setLocale = (locale: string) => {
  vi.mocked(useParams).mockReturnValue({ locale });
  vi.mocked(usePathname).mockReturnValue(`/${locale}/buddies`);
};

describe("SectionError", () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(
      {} as unknown as ReturnType<typeof useRouter>,
    );
  });

  it("reports the error, keeps the section header and offers a retry", async () => {
    setLocale("en");
    const error = new Error("boom");
    const retry = vi.fn();
    render(<SectionError error={error} retry={retry} titleKey="buddies" />);

    expect(Sentry.captureException).toHaveBeenCalledExactlyOnceWith(error);
    expect(
      screen.getByRole("heading", { level: 1, name: "Buddies" }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.queryByText("boom")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("is translated into Lithuanian", () => {
    setLocale("lt");
    render(<SectionError error="oops" retry={vi.fn()} titleKey="sessions" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Treniruotės" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: "Kažkas nepavyko" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Bandyti dar kartą" }),
    ).toBeVisible();
    expect(Sentry.captureException).toHaveBeenCalledWith("oops");
  });
});
