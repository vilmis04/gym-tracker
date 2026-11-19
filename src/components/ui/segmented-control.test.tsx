import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./segmented-control";

const OPTIONS = [
  { value: "lukas", label: "Lukas" },
  { value: "jonas", label: "Jonas" },
  { value: "ona", label: "Ona" },
] as const;

type Participant = (typeof OPTIONS)[number]["value"];

function ControlledSegmentedControl({
  onValueChange,
}: {
  onValueChange: (value: Participant) => void;
}) {
  const [value, setValue] = useState<Participant>("lukas");
  return (
    <SegmentedControl
      legend="Logging for"
      options={OPTIONS}
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        onValueChange(nextValue);
      }}
    />
  );
}

describe("SegmentedControl", () => {
  it("is a labelled group of radios with the value checked", () => {
    render(
      <SegmentedControl
        legend="Logging for"
        options={OPTIONS}
        value="jonas"
        onValueChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Logging for" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Jonas" })).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("checks nothing for a null value", () => {
    render(
      <SegmentedControl
        legend="Logging for"
        options={OPTIONS}
        value={null}
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("radio", { checked: true })).toBeNull();
  });

  it("Tab focuses the checked option, arrow keys change it, clicks pick one", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<ControlledSegmentedControl onValueChange={onValueChange} />);

    await user.tab();
    expect(screen.getByRole("radio", { name: "Lukas" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Jonas" })).toBeChecked();
    await user.click(screen.getByText("Ona"));

    expect(screen.getByRole("radio", { name: "Ona" })).toBeChecked();
    expect(onValueChange.mock.calls).toEqual([["jonas"], ["ona"]]);
  });
});
