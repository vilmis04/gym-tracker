import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import UiPage from "./page";

const SECTIONS = [
  "Button",
  "Input, Textarea, Label, FormField",
  "Card",
  "Dialog, Sheet, Popover, DropdownMenu",
  "Tabs",
  "SegmentedControl",
  "Toast",
  "Avatar, AvatarStack",
  "Chip, Badge",
  "Skeleton",
  "EmptyState",
];

describe("/dev/ui (base UI components preview)", () => {
  it("has a section for every component group and the theme toggle", () => {
    render(<UiPage />);

    for (const section of SECTIONS) {
      expect(screen.getByRole("region", { name: section })).toBeInTheDocument();
    }
    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
  });

  it("shows every button variant and the overlay triggers", () => {
    render(<UiPage />);

    for (const variant of ["primary", "secondary", "ghost", "destructive"]) {
      expect(
        screen.getByRole("button", { name: `${variant} md` }),
      ).toBeInTheDocument();
    }
    for (const trigger of [
      "Delete session",
      "Add exercise",
      "Filter",
      "Session actions",
    ]) {
      expect(screen.getByRole("button", { name: trigger })).toBeInTheDocument();
    }
  });
});
