import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar, getAvatarFillClassName, getInitials } from "./avatar";
import { AvatarStack } from "./avatar-stack";

const PEOPLE = [
  { id: "1", name: "Lukas" },
  { id: "2", name: "Jonas" },
  { id: "3", name: "Ona" },
  { id: "4", name: "Rūta" },
  { id: "5", name: "Tomas" },
];

describe("getInitials", () => {
  it("takes the first letters of the first and last word", () => {
    expect(getInitials("Lukas")).toBe("L");
    expect(getInitials("  rūta  žemaitė ")).toBe("RŽ");
    expect(getInitials("Jonas Antanas Petraitis")).toBe("JP");
    expect(getInitials("")).toBe("");
  });
});

describe("getAvatarFillClassName", () => {
  it("gives a name always the same of the five fills", () => {
    expect(getAvatarFillClassName("Lukas")).toBe(
      getAvatarFillClassName("Lukas"),
    );
    const fills = new Set(
      PEOPLE.map((person) => getAvatarFillClassName(person.name)),
    );
    for (const fill of fills) {
      expect(fill).toMatch(/^bg-avatar-[1-5]$/);
    }
  });
});

describe("Avatar", () => {
  it("is an image named after the person, showing the initials", () => {
    render(<Avatar name="Rūta Žemaitė" />);

    expect(screen.getByRole("img", { name: "Rūta Žemaitė" })).toHaveTextContent(
      "RŽ",
    );
  });

  it("is hidden from screen readers when decorative", () => {
    render(<Avatar name="Ona" isDecorative />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("AvatarStack", () => {
  it("lists the first avatars and announces how many are hidden", () => {
    render(<AvatarStack people={PEOPLE} label="Participants" maxVisible={3} />);

    const list = screen.getByRole("list", { name: "Participants" });
    expect(
      within(list)
        .getAllByRole("img")
        .map((avatar) => avatar.getAttribute("aria-label")),
    ).toEqual(["Lukas", "Jonas", "Ona"]);
    expect(within(list).getByText("+2")).toHaveAttribute("aria-hidden", "true");
    expect(within(list).getByText("and 2 more")).toBeInTheDocument();
  });

  it("has no counter when everyone fits", () => {
    render(<AvatarStack people={PEOPLE.slice(0, 2)} label="Participants" />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
