import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Chip } from "./chip";

describe("Chip", () => {
  it("is static text without onRemove", () => {
    render(<Chip label="legs" />);

    expect(screen.getByText("legs")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("removable: the × button is named after the chip and removes it on click", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<Chip label="legs" onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remove legs" }));

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("removable from the keyboard: Enter, Space, Delete and Backspace on the focused ×", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <Chip label="quads" onRemove={onRemove} removeLabel="Remove tag quads" />,
    );

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Remove tag quads" }),
    ).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    await user.keyboard("{Delete}");
    await user.keyboard("{Backspace}");

    expect(onRemove).toHaveBeenCalledTimes(4);
  });
});
