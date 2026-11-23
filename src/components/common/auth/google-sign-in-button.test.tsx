import * as Sentry from "@sentry/nextjs";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sso } from "@tests/helpers/clerk-mock";
import { renderWithIntl } from "@tests/helpers/render-with-intl";

import { GoogleSignInButton } from "./google-sign-in-button";

vi.mock("@clerk/nextjs", () => import("@tests/helpers/clerk-mock"));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

/** An `sso()` that never settles: the browser has left for Google. */
const mockRedirectInProgress = () =>
  sso.mockImplementation(() => new Promise(() => {}));

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    sso.mockReset();
    sso.mockResolvedValue({ error: null });
    vi.mocked(Sentry.captureException).mockClear();
  });

  it("starts Google sign-in in one tap, returning through the sign-in route to Home", async () => {
    const user = userEvent.setup();
    renderWithIntl(<GoogleSignInButton />, { locale: "en" });

    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(sso).toHaveBeenCalledOnce();
    expect(sso).toHaveBeenCalledWith({
      strategy: "oauth_google",
      redirectCallbackUrl: "/en/sign-in/sso-callback",
      redirectUrl: "/en/dashboard",
    });
  });

  it("uses the Lithuanian routes and text under /lt", async () => {
    const user = userEvent.setup();
    renderWithIntl(<GoogleSignInButton />, { locale: "lt" });

    await user.click(screen.getByRole("button", { name: "Tęsti su Google" }));

    expect(sso).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectCallbackUrl: "/lt/sign-in/sso-callback",
        redirectUrl: "/lt/dashboard",
      }),
    );
  });

  it("shows a spinner while leaving for Google and ignores more taps", async () => {
    mockRedirectInProgress();
    const user = userEvent.setup();
    renderWithIntl(<GoogleSignInButton />, { locale: "en" });
    const button = screen.getByRole("button", {
      name: "Continue with Google",
    });

    await user.click(button);
    await user.click(button);

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAccessibleName(
      "Opening Google sign-in Continue with Google",
    );
    expect(sso).toHaveBeenCalledOnce();
  });

  it("is ready again when the page comes back from the back/forward cache", async () => {
    mockRedirectInProgress();
    const user = userEvent.setup();
    renderWithIntl(<GoogleSignInButton />, { locale: "en" });
    const button = screen.getByRole("button", {
      name: "Continue with Google",
    });
    await user.click(button);

    act(() => {
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      );
    });

    expect(button).not.toHaveAttribute("aria-busy");
  });

  it.each([
    [
      "answers with an error",
      () => sso.mockResolvedValue({ error: new Error("oauth") }),
    ],
    ["throws", () => sso.mockRejectedValue(new Error("network"))],
  ])(
    "says so and can be tried again when Clerk %s",
    async (_case, mockFailure) => {
      mockFailure();
      const user = userEvent.setup();
      renderWithIntl(<GoogleSignInButton />, { locale: "en" });
      const button = screen.getByRole("button", {
        name: "Continue with Google",
      });

      await user.click(button);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Couldn’t open Google sign-in. Please try again.",
      );
      expect(button).toHaveAccessibleDescription(
        "Couldn’t open Google sign-in. Please try again.",
      );
      expect(button).not.toHaveAttribute("aria-busy");
      expect(Sentry.captureException).toHaveBeenCalledOnce();

      sso.mockResolvedValue({ error: null });
      await user.click(button);
      expect(sso).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    },
  );
});
