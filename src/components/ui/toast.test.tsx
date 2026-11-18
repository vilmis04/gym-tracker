import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { showToast, Toaster, TOAST_DURATION_MS } from "./toast";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the message in a polite live region and dismisses it after 4 s", async () => {
    render(<Toaster />);

    act(() => {
      showToast("Set saved", { description: "30 kg × 10" });
    });

    expect(await screen.findByText("Set saved")).toBeInTheDocument();
    expect(screen.getByText("30 kg × 10")).toBeInTheDocument();
    expect(
      screen.getByText("Set saved").closest("[aria-live]"),
    ).toHaveAttribute("aria-live", "polite");
    expect(TOAST_DURATION_MS).toBe(4000);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TOAST_DURATION_MS - 500);
    });
    expect(screen.getByText("Set saved")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(screen.queryByText("Set saved")).not.toBeInTheDocument();
  });

  it("runs the action from the keyboard", async () => {
    const onUndo = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Toaster />);

    act(() => {
      showToast("Set deleted", { action: { label: "Undo", onClick: onUndo } });
    });
    (await screen.findByRole("button", { name: "Undo" })).focus();
    await user.keyboard("{Enter}");

    expect(onUndo).toHaveBeenCalledOnce();
  });
});
