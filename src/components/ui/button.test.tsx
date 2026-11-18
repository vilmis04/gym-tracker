import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("is a plain button (type=button) that runs onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    await user.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("while loading: shows the spinner, is busy, stays focusable and ignores clicks", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button isLoading onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Loading Save" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toBeEnabled();

    await user.tab();
    expect(button).toHaveFocus();
    await user.click(button);
    await user.keyboard("{Enter}");

    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not submit its form again while loading", async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const user = userEvent.setup();
    const { rerender } = render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <Button type="submit">Save</Button>
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledOnce();

    rerender(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <Button type="submit" isLoading loadingLabel="Saving">
          Save
        </Button>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "Saving Save" }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("renders its child with the button styles when asChild", () => {
    render(
      <Button asChild variant="secondary">
        <a href="/sessions">Sessions</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Sessions" });
    expect(link).toHaveAttribute("href", "/sessions");
    expect(link).not.toHaveAttribute("type");
    expect(link).toHaveClass("border-input");
  });
});
