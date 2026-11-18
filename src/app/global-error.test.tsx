import * as Sentry from "@sentry/nextjs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import GlobalError from "./global-error";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

describe("GlobalError", () => {
  it("reports the error and offers a retry", async () => {
    const error = new Error("boom");
    const retry = vi.fn();
    // Renders its own <html>/<body>; React warns about nesting them in a div.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<GlobalError error={error} retry={retry} />);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
