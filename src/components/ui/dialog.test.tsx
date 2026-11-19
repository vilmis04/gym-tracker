import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@tests/helpers/render-with-intl";

import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const renderDialog = () =>
  renderWithIntl(
    <>
      <button type="button">Before</button>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Delete session</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this session?</DialogTitle>
            <DialogDescription>This can’t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <button type="button">After</button>
    </>,
    { locale: "en" },
  );

const renderSheet = () =>
  renderWithIntl(
    <>
      <button type="button">Before</button>
      <Sheet>
        <SheetTrigger asChild>
          <Button>Add exercise</Button>
        </SheetTrigger>
        <SheetContent closeLabel="Close picker">
          <SheetHeader>
            <SheetTitle>Add exercise</SheetTitle>
            <SheetDescription>Search your exercises.</SheetDescription>
          </SheetHeader>
          <input aria-label="Search exercises" />
        </SheetContent>
      </Sheet>
      <button type="button">After</button>
    </>,
    { locale: "en" },
  );

describe("Dialog", () => {
  it("opens from the keyboard as a labelled modal and moves focus into it", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.tab();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Delete session" }),
    ).toHaveFocus();
    await user.keyboard("{Enter}");

    const dialog = screen.getByRole("dialog", { name: "Delete this session?" });
    expect(dialog).toHaveAccessibleDescription("This can’t be undone.");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("traps focus: Tab and Shift+Tab cycle through the dialog only", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Delete session" }));
    const dialog = screen.getByRole("dialog");

    const focusedNames: string[] = [];
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
      focusedNames.push(document.activeElement?.textContent ?? "");
    }
    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    expect(new Set(focusedNames)).toEqual(new Set(["Cancel", "Delete", ""]));
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("closes on Esc and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderDialog();
    const trigger = screen.getByRole("button", { name: "Delete session" });
    await user.click(trigger);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes with the × button and with a DialogClose action", async () => {
    const user = userEvent.setup();
    renderDialog();
    const trigger = screen.getByRole("button", { name: "Delete session" });

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Sheet", () => {
  it("traps focus, closes on Esc and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderSheet();
    const trigger = screen.getByRole("button", { name: "Add exercise" });
    trigger.focus();
    await user.keyboard("{Enter}");

    const sheet = screen.getByRole("dialog", { name: "Add exercise" });
    expect(sheet).toContainElement(document.activeElement as HTMLElement);
    for (let i = 0; i < 4; i++) {
      await user.tab();
      expect(sheet).toContainElement(document.activeElement as HTMLElement);
    }
    expect(
      screen.getByRole("button", { name: "Close picker" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
