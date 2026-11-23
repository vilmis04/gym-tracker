import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@tests/helpers/render-with-intl";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const renderMenu = (onRename = vi.fn(), onLeave = vi.fn()) =>
  renderWithIntl(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Session actions">
          ⋯
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Session</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onRename}>Rename</DropdownMenuItem>
        <DropdownMenuItem disabled>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onLeave}>
          Leave session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
    { locale: "en" },
  );

describe("DropdownMenu", () => {
  it("opens with Enter, focuses the first item, arrows skip disabled items, Enter selects", async () => {
    const onRename = vi.fn();
    const onLeave = vi.fn();
    const user = userEvent.setup();
    renderMenu(onRename, onLeave);
    const trigger = screen.getByRole("button", { name: "Session actions" });

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(
      screen.getByRole("menuitem", { name: "Leave session" }),
    ).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onLeave).toHaveBeenCalledOnce();
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on Esc without selecting and returns focus to the trigger", async () => {
    const onRename = vi.fn();
    const user = userEvent.setup();
    renderMenu(onRename);
    const trigger = screen.getByRole("button", { name: "Session actions" });
    trigger.focus();

    await user.keyboard("{Enter}");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(onRename).not.toHaveBeenCalled();
  });
});
