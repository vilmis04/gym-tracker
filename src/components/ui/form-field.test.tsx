import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "./form-field";
import { Input } from "./input";
import { Textarea } from "./textarea";

describe("FormField", () => {
  it("labels the control and links the help text", () => {
    render(
      <FormField label="Name" help="Shown to your buddies.">
        <Input />
      </FormField>,
    );

    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAccessibleDescription("Shown to your buddies.");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marks the control invalid and describes it with the error", () => {
    render(
      <FormField label="Notes" help="Optional." error="Too long.">
        <Textarea />
      </FormField>,
    );

    const textarea = screen.getByRole("textbox", { name: "Notes" });
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAccessibleDescription("Optional. Too long.");
  });

  it("treats a null error as valid and can hide the label visually", () => {
    render(
      <FormField label="Search exercises" error={null} isLabelHidden>
        <Input type="search" />
      </FormField>,
    );

    const input = screen.getByRole("searchbox", { name: "Search exercises" });
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(screen.getByText("Search exercises")).toHaveClass("sr-only");
  });
});
