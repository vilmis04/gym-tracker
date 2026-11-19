import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Locale } from "@/lib/i18n/i18n.types";
import { renderWithIntl } from "@tests/helpers/render-with-intl";

import { THEME_STORAGE_KEY } from "./theme-preferences";
import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

import type { OnThemePreferenceChange } from "./theme.types";

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

type ColorSchemeListener = (
  event: Pick<MediaQueryListEvent, "matches">,
) => void;

// jsdom has no matchMedia; next-themes needs it for the `system` theme.
const stubColorScheme = (isOsDark: boolean) => {
  const listeners = new Set<ColorSchemeListener>();
  const mediaQueryList = {
    matches: isOsDark,
    media: DARK_SCHEME_QUERY,
    addListener: (listener: ColorSchemeListener) => listeners.add(listener),
    removeListener: (listener: ColorSchemeListener) =>
      listeners.delete(listener),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mediaQueryList),
  );
  return {
    setIsOsDark: (isDark: boolean) => {
      mediaQueryList.matches = isDark;
      for (const listener of listeners) {
        listener(mediaQueryList);
      }
    },
  };
};

const renderToggle = (
  onThemePreferenceChange?: OnThemePreferenceChange,
  locale: Locale = "en",
) =>
  renderWithIntl(
    <ThemeProvider>
      <ThemeToggle onThemePreferenceChange={onThemePreferenceChange} />
    </ThemeProvider>,
    { locale },
  );

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is a labelled radio group with Light, Dark and System, System checked by default", () => {
    stubColorScheme(false);
    renderToggle();

    const group = screen.getByRole("group", { name: "Theme" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Light" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Dark" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
  });

  it("is translated into Lithuanian", () => {
    stubColorScheme(false);
    renderToggle(undefined, "lt");

    expect(screen.getByRole("group", { name: "Tema" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("radio").map((radio) => radio.getAttribute("value")),
    ).toEqual(["light", "dark", "system"]);
    expect(screen.getByRole("radio", { name: "Kaip sistemoje" })).toBeChecked();
  });

  it("applies and stores the theme picked by click and calls the save hook", async () => {
    stubColorScheme(false);
    const onThemePreferenceChange = vi.fn<OnThemePreferenceChange>();
    const user = userEvent.setup();
    renderToggle(onThemePreferenceChange);

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(onThemePreferenceChange).toHaveBeenCalledExactlyOnceWith("dark");
  });

  it("is operable with the keyboard: Tab focuses the checked option, arrows change it", async () => {
    stubColorScheme(false);
    const user = userEvent.setup();
    renderToggle();

    await user.tab();
    expect(screen.getByRole("radio", { name: "System" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    expect(document.documentElement).toHaveClass("dark");

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("restores the stored choice", () => {
    stubColorScheme(false);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    renderToggle();

    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
  });

  it("checks nothing for an unknown stored value", () => {
    stubColorScheme(false);
    localStorage.setItem(THEME_STORAGE_KEY, "neon");
    renderToggle();

    expect(screen.queryByRole("radio", { checked: true })).toBeNull();
  });

  it("follows the OS setting live with System", () => {
    const colorScheme = stubColorScheme(false);
    renderToggle();
    expect(document.documentElement).toHaveClass("light");

    act(() => colorScheme.setIsOsDark(true));

    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
  });
});
