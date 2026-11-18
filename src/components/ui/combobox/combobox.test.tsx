import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeSearchText } from "@/lib/utils/normalize-search-text";

import { FormField } from "../form-field";
import { Combobox } from "./combobox";
import { SEARCH_DEBOUNCE_MS } from "./use-combobox-search";

import type { ComboboxSearch } from "./combobox.types";

interface Exercise {
  id: string;
  name: string;
}

const SPAUDIMAS = { id: "1", name: "Špaudimas" };
const SPAUDIMAS_GULINT = { id: "2", name: "spaudimas gulint" };
const PRITUPIMAI = { id: "3", name: "Pritūpimai" };
const SQUAT = { id: "4", name: "Squat" };
const EXERCISES: readonly Exercise[] = [
  SPAUDIMAS,
  SPAUDIMAS_GULINT,
  PRITUPIMAI,
  SQUAT,
];
const RECENT: readonly Exercise[] = [SQUAT, PRITUPIMAI];

const getKey = (exercise: Exercise) => exercise.id;
const getLabel = (exercise: Exercise) => exercise.name;

const findExercises = (query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  return EXERCISES.filter((exercise) =>
    normalizeSearchText(exercise.name).includes(normalizedQuery),
  );
};

/** Answers at once with the exercises containing the query. */
const createSearch = () =>
  vi.fn<ComboboxSearch<Exercise>>((query) =>
    Promise.resolve(findExercises(query)),
  );

/** Answers after a per-query delay (fake timers), ignoring the abort signal. */
const createDelayedSearch = (delayForQuery: (query: string) => number) =>
  vi.fn<ComboboxSearch<Exercise>>(
    (query) =>
      new Promise((resolve) => {
        setTimeout(() => resolve(findExercises(query)), delayForQuery(query));
      }),
  );

const SingleCombobox = ({
  onSearch,
  onCreate,
  onValueChange,
}: {
  onSearch: ComboboxSearch<Exercise>;
  onCreate?: (query: string) => void;
  onValueChange?: (value: Exercise | null) => void;
}) => {
  const [value, setValue] = useState<Exercise | null>(null);
  const changeValue = (nextValue: Exercise | null) => {
    setValue(nextValue);
    onValueChange?.(nextValue);
  };
  const createProps = onCreate
    ? { allowCreate: true as const, onCreate }
    : { allowCreate: false as const };
  return (
    <FormField label="Exercise">
      <Combobox
        label="Exercise"
        placeholder="Choose an exercise"
        onSearch={onSearch}
        getKey={getKey}
        getLabel={getLabel}
        initialItems={RECENT}
        value={value}
        onChange={changeValue}
        {...createProps}
      />
    </FormField>
  );
};

const MultipleCombobox = ({
  initialValue,
}: {
  initialValue: readonly Exercise[];
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <Combobox
      label="Exercises"
      placeholder="Add exercise"
      onSearch={createSearch()}
      getKey={getKey}
      getLabel={getLabel}
      initialItems={EXERCISES}
      multiple
      value={value}
      onChange={setValue}
    />
  );
};

const stubIsDesktop = (isDesktop: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: isDesktop,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));

const waitForDebounce = () =>
  act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));

const getOptionNames = () =>
  screen.queryAllByRole("option").map((option) => option.textContent);

describe("Combobox", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.useFakeTimers();
    // Testing Library waits a (fake) macrotask after each event and only
    // advances fake timers through a global `jest`; point it at Vitest's.
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime });
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const openCombobox = () =>
    user.click(screen.getByRole("button", { name: /Exercise/ }));

  it("shows the initial items before typing, without searching", async () => {
    const onSearch = createSearch();
    render(<SingleCombobox onSearch={onSearch} />);

    const trigger = screen.getByRole("button", {
      name: "Exercise Choose an exercise",
    });
    await user.click(trigger);

    expect(screen.getByRole("combobox", { name: "Exercise" })).toHaveFocus();
    expect(getOptionNames()).toEqual(["Squat", "Pritūpimai"]);
    await waitForDebounce();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("searches 200 ms after the last keystroke with the trimmed query", async () => {
    const onSearch = createSearch();
    render(<SingleCombobox onSearch={onSearch} />);
    await openCombobox();

    await user.keyboard(" spaud ");
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS - 1));
    expect(onSearch).not.toHaveBeenCalled();
    expect(getOptionNames()).toEqual([]);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("spaud", {
      signal: expect.any(AbortSignal),
    });
    expect(getOptionNames()).toEqual(["Špaudimas", "spaudimas gulint"]);
    expect(screen.getByRole("status")).toHaveTextContent("2 results");
    // The first result is active, and the input says so for screen readers.
    const [firstOption] = screen.getAllByRole("option");
    expect(firstOption).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-activedescendant",
      firstOption?.id,
    );
  });

  it("never shows a stale response that arrives after a newer one", async () => {
    // "pri" answers slowly, "pritu" quickly: the old answer lands last.
    const onSearch = createDelayedSearch((query) =>
      query === "pri" ? 1000 : 50,
    );
    render(<SingleCombobox onSearch={onSearch} />);
    await openCombobox();

    await user.keyboard("pri");
    await waitForDebounce();
    expect(onSearch).toHaveBeenLastCalledWith("pri", expect.anything());
    const firstSignal = onSearch.mock.calls[0]?.[1].signal;

    await user.keyboard("tu");
    expect(firstSignal?.aborted).toBe(true);
    await waitForDebounce();
    await act(() => vi.advanceTimersByTimeAsync(50));
    expect(getOptionNames()).toEqual(["Pritūpimai"]);

    // The slow "pri" response resolves now and must be ignored.
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(getOptionNames()).toEqual(["Pritūpimai"]);
  });

  it("does not search for typing that is replaced within 200 ms", async () => {
    const onSearch = createSearch();
    render(<SingleCombobox onSearch={onSearch} />);
    await openCombobox();

    await user.keyboard("s");
    await act(() => vi.advanceTimersByTimeAsync(100));
    await user.keyboard("q");
    await act(() => vi.advanceTimersByTimeAsync(100));
    await user.keyboard("u");
    await waitForDebounce();

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("squ", expect.anything());
  });

  it("moves the highlight with ↑ / ↓, selects with Enter and closes", async () => {
    const onValueChange = vi.fn();
    render(
      <SingleCombobox
        onSearch={createSearch()}
        onValueChange={onValueChange}
      />,
    );
    await openCombobox();
    const input = screen.getByRole("combobox", { name: "Exercise" });
    const [squat, pritupimai] = screen.getAllByRole("option");

    expect(squat).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", squat?.id);

    await user.keyboard("{ArrowDown}");
    expect(pritupimai).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", pritupimai?.id);
    await user.keyboard("{ArrowUp}");
    expect(squat).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledWith(PRITUPIMAI);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", {
      name: "Exercise Pritūpimai",
    });
    expect(trigger).toHaveFocus();
  });

  it("closes on Esc and returns focus to the trigger", async () => {
    render(<SingleCombobox onSearch={createSearch()} />);
    await openCombobox();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exercise/ })).toHaveFocus();
  });

  it("marks accent-insensitive matches and hides Create on an exact normalized match", async () => {
    const onCreate = vi.fn();
    render(<SingleCombobox onSearch={createSearch()} onCreate={onCreate} />);
    await openCombobox();

    await user.keyboard("spaudimas");
    await waitForDebounce();

    const marks = screen
      .getAllByRole("option")
      .map((option) => option.querySelector("mark")?.textContent);
    expect(marks).toEqual(["Špaudimas", "spaudimas"]);
    expect(
      screen.queryByRole("option", { name: /Create/ }),
    ).not.toBeInTheDocument();
  });

  it("shows Create while there is no exact match, reachable by keyboard, and passes the trimmed query", async () => {
    const onCreate = vi.fn();
    render(<SingleCombobox onSearch={createSearch()} onCreate={onCreate} />);
    await openCombobox();

    await user.keyboard("  spaud  ");
    expect(
      screen.queryByRole("option", { name: /Create/ }),
    ).not.toBeInTheDocument();
    await waitForDebounce();

    const createOption = screen.getByRole("option", {
      name: "Create “spaud”",
    });
    expect(screen.getAllByRole("option").at(-1)).toBe(createOption);

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(createOption).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Enter}");

    expect(onCreate).toHaveBeenCalledWith("spaud");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("offers Create (only) when nothing is found, and announces it", async () => {
    const onCreate = vi.fn();
    render(<SingleCombobox onSearch={createSearch()} onCreate={onCreate} />);
    await openCombobox();

    await user.keyboard("Atsispaudimai");
    await waitForDebounce();

    expect(screen.getByRole("listbox")).toHaveTextContent("No results");
    expect(screen.getByRole("status")).toHaveTextContent("No results");
    const createOption = screen.getByRole("option", {
      name: "Create “Atsispaudimai”",
    });
    expect(createOption).toHaveAttribute("aria-selected", "true");
    await user.click(createOption);
    expect(onCreate).toHaveBeenCalledWith("Atsispaudimai");
  });

  it("shows an error when the search fails", async () => {
    const onSearch = vi.fn<ComboboxSearch<Exercise>>(() =>
      Promise.reject(new Error("offline")),
    );
    render(<SingleCombobox onSearch={onSearch} />);
    await openCombobox();

    await user.keyboard("squ");
    await waitForDebounce();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Couldn’t load results. Try again.",
    );
  });

  it("opens as a full-height sheet named after the label on a phone", async () => {
    render(<SingleCombobox onSearch={createSearch()} />);
    await openCombobox();

    const sheet = screen.getByRole("dialog", { name: "Exercise" });
    expect(
      within(sheet).getByRole("combobox", { name: "Exercise" }),
    ).toHaveFocus();
    expect(within(sheet).getByRole("listbox", { name: "Exercise" })).toBe(
      screen.getByRole("listbox"),
    );
  });

  it("opens as a popover (not a modal dialog) on a desktop", async () => {
    stubIsDesktop(true);
    render(<SingleCombobox onSearch={createSearch()} />);
    await openCombobox();

    expect(screen.queryByRole("dialog", { name: "Exercise" })).toBeNull();
    expect(screen.getByRole("combobox", { name: "Exercise" })).toHaveFocus();
    expect(screen.getByRole("listbox", { name: "Exercise" })).toBeVisible();
  });

  describe("multiple", () => {
    it("toggles items, keeps the list open and shows them as chips", async () => {
      render(<MultipleCombobox initialValue={[]} />);
      await user.click(screen.getByRole("button", { name: /Add exercise/ }));

      await user.click(screen.getByRole("option", { name: "Squat" }));
      await user.click(screen.getByRole("option", { name: "Pritūpimai" }));

      expect(screen.getByRole("option", { name: "Squat" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await user.keyboard("{Escape}");
      const chips = screen.getByRole("list", { name: "Exercises" });
      expect(
        within(chips)
          .getAllByRole("listitem")
          .map((chip) => chip.textContent),
      ).toEqual(["Squat", "Pritūpimai"]);

      await user.click(screen.getByRole("button", { name: /Add exercise/ }));
      await user.click(screen.getByRole("option", { name: "Squat" }));
      await user.keyboard("{Escape}");
      expect(
        within(screen.getByRole("list", { name: "Exercises" }))
          .getAllByRole("listitem")
          .map((chip) => chip.textContent),
      ).toEqual(["Pritūpimai"]);
    });

    it("moves focus to the next chip, the previous one, then the trigger as chips are removed", async () => {
      render(
        <MultipleCombobox initialValue={[SPAUDIMAS, PRITUPIMAI, SQUAT]} />,
      );

      await user.click(
        screen.getByRole("button", { name: "Remove Špaudimas" }),
      );
      expect(
        screen.getByRole("button", { name: "Remove Pritūpimai" }),
      ).toHaveFocus();

      await user.click(screen.getByRole("button", { name: "Remove Squat" }));
      expect(
        screen.getByRole("button", { name: "Remove Pritūpimai" }),
      ).toHaveFocus();

      await user.keyboard("{Delete}");
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Exercises Add exercise" }),
      ).toHaveFocus();
    });
  });
});
