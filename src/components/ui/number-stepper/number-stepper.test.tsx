import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FormField } from "../form-field";
import { NumberStepper } from "./number-stepper";
import { NUMBER_STEPPER_PRESETS } from "./number-stepper-presets";
import { getAutoRepeatDelay } from "./use-auto-repeat";

import type { NumberStepperProps } from "./number-stepper.types";

type StepperTestProps = Partial<Omit<NumberStepperProps, "onChange">> & {
  preset?: keyof typeof NUMBER_STEPPER_PRESETS;
  onChange?: (value: number) => void;
};

// A controlled stepper like the set-logging form will use; `onChange` spies
// on what it stores.
function ControlledStepper({
  preset = "weight",
  value: initialValue = null,
  onChange,
  ...props
}: StepperTestProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <NumberStepper
      {...NUMBER_STEPPER_PRESETS[preset]}
      label="Weight"
      {...props}
      value={value}
      onChange={(nextValue) => {
        setValue(nextValue);
        onChange?.(nextValue);
      }}
    />
  );
}

const getInput = () => screen.getByRole("spinbutton", { name: "Weight" });

describe("NumberStepper", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("stores 57.5 for both 57,5 and 57.5 and shows the locale's separator", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { unmount } = render(
      <ControlledStepper value={20} locale="lt" onChange={handleChange} />,
    );

    await user.clear(getInput());
    await user.type(getInput(), "57.5");
    await user.tab();
    expect(handleChange).toHaveBeenLastCalledWith(57.5);
    expect(getInput()).toHaveValue("57,5");
    unmount();

    render(
      <ControlledStepper value={20} locale="en" onChange={handleChange} />,
    );
    await user.clear(getInput());
    await user.type(getInput(), "57,5");
    await user.tab();
    expect(handleChange).toHaveBeenLastCalledWith(57.5);
    expect(getInput()).toHaveValue("57.5");
  });

  it("defaults to the Lithuanian separator", () => {
    render(<ControlledStepper value={57.5} />);
    expect(getInput()).toHaveValue("57,5");
  });

  it("passes valid in-range numbers on while typing, clamps on blur", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledStepper value={20} onChange={handleChange} />);

    await user.clear(getInput());
    await user.type(getInput(), "1200");
    // 1, 12 and 120 were valid on the way; 1200 is above 999.75.
    expect(handleChange.mock.calls).toEqual([[1], [12], [120]]);
    expect(getInput()).toHaveValue("1200");

    await user.tab();
    expect(handleChange).toHaveBeenLastCalledWith(999.75);
    expect(getInput()).toHaveValue("999,75");
  });

  it("clamps below min on blur", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ControlledStepper preset="reps" value={8} onChange={handleChange} />,
    );

    await user.clear(getInput());
    await user.type(getInput(), "0");
    expect(handleChange).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(handleChange).toHaveBeenLastCalledWith(1);
    expect(getInput()).toHaveValue("1");
  });

  it("reverts invalid or empty input to the last valid value", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledStepper value={60} onChange={handleChange} />);

    await user.clear(getInput());
    await user.type(getInput(), "abc");
    await user.tab();
    expect(getInput()).toHaveValue("60");

    await user.clear(getInput());
    await user.tab();
    expect(getInput()).toHaveValue("60");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("rounds extra decimals and shows the rounded value", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledStepper value={60} onChange={handleChange} />);

    await user.clear(getInput());
    await user.type(getInput(), "57,555");
    await user.tab();
    expect(handleChange).toHaveBeenLastCalledWith(57.56);
    expect(getInput()).toHaveValue("57,56");
  });

  it("steps by 2.5 with the buttons without drift and announces the value", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledStepper value={0.1} onChange={handleChange} />);
    const increase = screen.getByRole("button", { name: "Increase by 2,5 kg" });

    await user.click(increase);
    await user.click(increase);
    expect(handleChange.mock.calls).toEqual([[2.6], [5.1]]);
    expect(getInput()).toHaveValue("5,1");
    expect(screen.getByRole("status")).toHaveTextContent("5,1 kg");

    await user.click(
      screen.getByRole("button", { name: "Decrease by 2,5 kg" }),
    );
    expect(handleChange).toHaveBeenLastCalledWith(2.6);
    expect(screen.getByRole("status")).toHaveTextContent("2,6 kg");
  });

  it("steps from the keyboard on a focused button", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledStepper value={20} onChange={handleChange} />);

    screen.getByRole("button", { name: "Increase by 2,5 kg" }).focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(handleChange.mock.calls).toEqual([[22.5], [25]]);
    expect(screen.getByRole("status")).toHaveTextContent("25 kg");
  });

  it("starts an empty field at min and shows the placeholder", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledStepper preset="reps" onChange={handleChange} />);
    expect(getInput()).toHaveValue("");
    expect(getInput()).toHaveAttribute("placeholder", "—");
    expect(getInput()).not.toHaveAttribute("aria-valuenow");

    await user.click(screen.getByRole("button", { name: "Increase by 1" }));
    expect(handleChange).toHaveBeenLastCalledWith(1);
  });

  it("commits a typed value before a button press steps from it", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledStepper value={20} onChange={handleChange} />);

    await user.clear(getInput());
    await user.type(getInput(), "1200");
    await user.click(
      screen.getByRole("button", { name: "Decrease by 2,5 kg" }),
    );
    expect(handleChange).toHaveBeenLastCalledWith(997.25);
    expect(getInput()).toHaveValue("997,25");
  });

  it("steps with the arrow and page keys on the input", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledStepper value={50} onChange={handleChange} />);

    await user.click(getInput());
    await user.keyboard("{ArrowUp}");
    expect(handleChange).toHaveBeenLastCalledWith(52.5);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(handleChange).toHaveBeenLastCalledWith(47.5);
    await user.keyboard("{PageUp}");
    expect(handleChange).toHaveBeenLastCalledWith(72.5);
    await user.keyboard("{PageDown}");
    expect(handleChange).toHaveBeenLastCalledWith(47.5);
    expect(getInput()).toHaveValue("47,5");
    // The spinbutton's own value text is what screen readers read here.
    expect(getInput()).toHaveAttribute("aria-valuetext", "47,5 kg");
  });

  it("is a labelled spinbutton with a numeric keyboard and FormField wiring", async () => {
    const user = userEvent.setup();
    render(
      <FormField label="Weight" help="Per side" error="Too heavy">
        <NumberStepper
          {...NUMBER_STEPPER_PRESETS.weight}
          label="Weight"
          locale="en"
          value={57.5}
          onChange={() => {}}
        />
      </FormField>,
    );
    const input = getInput();

    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input).toHaveAttribute("aria-valuenow", "57.5");
    expect(input).toHaveAttribute("aria-valuemin", "0");
    expect(input).toHaveAttribute("aria-valuemax", "999.75");
    expect(input).toHaveAttribute("aria-valuetext", "57.5 kg");
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Per side Too heavy");
    expect(screen.getByRole("group", { name: "Weight" })).toBeInTheDocument();

    await user.click(screen.getByText("Weight", { selector: "label" }));
    expect(input).toHaveFocus();
  });

  it("uses the numeric keyboard for whole numbers", () => {
    render(
      <NumberStepper
        {...NUMBER_STEPPER_PRESETS.reps}
        label="Reps"
        value={10}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveAttribute(
      "inputmode",
      "numeric",
    );
  });

  it("marks the button at a bound and ignores it", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ControlledStepper preset="reps" value={1} onChange={handleChange} />,
    );
    const decrease = screen.getByRole("button", { name: "Decrease by 1" });

    expect(decrease).toHaveAttribute("aria-disabled", "true");
    await user.click(decrease);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("disables the input and both buttons", () => {
    render(<ControlledStepper value={10} disabled />);
    expect(getInput()).toBeDisabled();
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });

  describe("press and hold", () => {
    const setUpFakeTimers = () => {
      vi.useFakeTimers();
      vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime });
      return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    };

    it("repeats faster and faster while held and stops on release", async () => {
      const user = setUpFakeTimers();
      const handleChange = vi.fn();
      render(
        <ControlledStepper preset="reps" value={10} onChange={handleChange} />,
      );

      await user.pointer({
        keys: "[MouseLeft>]",
        target: screen.getByRole("button", { name: "Increase by 1" }),
      });
      expect(handleChange).toHaveBeenCalledTimes(1);

      await act(() => vi.advanceTimersByTimeAsync(1000));
      const stepsInFirstSecond = handleChange.mock.calls.length;
      await act(() => vi.advanceTimersByTimeAsync(1000));
      const stepsInSecondSecond =
        handleChange.mock.calls.length - stepsInFirstSecond;
      expect(stepsInFirstSecond).toBeGreaterThan(3);
      expect(stepsInSecondSecond).toBeGreaterThan(stepsInFirstSecond);
      // Nothing is announced while the value is still changing.
      expect(screen.getByRole("status")).toHaveTextContent("");

      await user.pointer({ keys: "[/MouseLeft]" });
      const stepsWhenReleased = handleChange.mock.calls.length;
      const finalValue = 10 + stepsWhenReleased;
      expect(handleChange).toHaveBeenLastCalledWith(finalValue);
      expect(getInput()).toHaveValue(String(finalValue));
      expect(screen.getByRole("status")).toHaveTextContent(String(finalValue));

      await act(() => vi.advanceTimersByTimeAsync(2000));
      expect(handleChange).toHaveBeenCalledTimes(stepsWhenReleased);
    });

    it("stops when the pointer leaves or is cancelled", async () => {
      setUpFakeTimers();
      const handleChange = vi.fn();
      render(<ControlledStepper value={50} onChange={handleChange} />);
      const decrease = screen.getByRole("button", {
        name: "Decrease by 2,5 kg",
      });

      fireEvent.pointerDown(decrease, { button: 0 });
      await act(() => vi.advanceTimersByTimeAsync(600));
      fireEvent.pointerLeave(decrease);
      const stepsWhenLeft = handleChange.mock.calls.length;
      expect(stepsWhenLeft).toBeGreaterThan(1);

      fireEvent.pointerDown(decrease, { button: 0 });
      fireEvent.pointerCancel(decrease);
      await act(() => vi.advanceTimersByTimeAsync(2000));
      expect(handleChange).toHaveBeenCalledTimes(stepsWhenLeft + 1);
    });

    it("stops at the bound and on unmount", async () => {
      setUpFakeTimers();
      const handleChange = vi.fn();
      const { unmount } = render(
        <ControlledStepper value={995} onChange={handleChange} />,
      );
      const increase = screen.getByRole("button", {
        name: "Increase by 2,5 kg",
      });

      fireEvent.pointerDown(increase, { button: 0 });
      await act(() => vi.advanceTimersByTimeAsync(3000));
      expect(handleChange.mock.calls).toEqual([[997.5], [999.75]]);

      fireEvent.pointerDown(
        screen.getByRole("button", { name: "Decrease by 2,5 kg" }),
        { button: 0 },
      );
      unmount();
      await act(() => vi.advanceTimersByTimeAsync(3000));
      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it("ignores the secondary button and the context menu", () => {
      const handleChange = vi.fn();
      render(<ControlledStepper value={50} onChange={handleChange} />);
      const increase = screen.getByRole("button", {
        name: "Increase by 2,5 kg",
      });

      fireEvent.pointerDown(increase, { button: 2 });
      expect(handleChange).not.toHaveBeenCalled();
      expect(fireEvent.contextMenu(increase)).toBe(false);
    });
  });
});

describe("getAutoRepeatDelay", () => {
  it("waits before the first repeat, then shortens the interval to a floor", () => {
    const delays = Array.from({ length: 20 }, (_, i) => getAutoRepeatDelay(i));
    expect(delays[0]).toBe(400);
    expect(delays[1]).toBe(200);
    for (let i = 2; i < delays.length; i++) {
      expect(delays[i]).toBeLessThanOrEqual(delays[i - 1] ?? 0);
    }
    expect(delays.at(-1)).toBe(50);
  });
});
