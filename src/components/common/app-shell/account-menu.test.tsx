import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams, usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/components/common/theme/theme-provider";

import { AccountMenu } from "./account-menu";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

const replace = vi.fn();

const renderMenu = (locale = "en", pathname = `/${locale}/sessions/123`) => {
  vi.mocked(useParams).mockReturnValue({ locale });
  vi.mocked(usePathname).mockReturnValue(pathname);
  vi.mocked(useRouter).mockReturnValue({
    replace,
  } as unknown as ReturnType<typeof useRouter>);
  return render(
    <ThemeProvider>
      <AccountMenu />
    </ThemeProvider>,
  );
};

// Plain items and radio items, in document order.
const getMenuItemNames = () =>
  Array.from(
    screen.getByRole("menu").querySelectorAll('[role^="menuitem"]'),
    (item) => item.textContent?.trim() ?? "",
  );

describe("AccountMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("opens with Enter and the arrow keys reach every item in order", async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole("button", {
      name: "Account, language and theme",
    });

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(getMenuItemNames()).toEqual([
      "Lietuvių",
      "English",
      "Light",
      "Dark",
      "System",
      "Settings",
    ]);
    const visitedItems: string[] = [];
    for (let i = 0; i < 6; i++) {
      visitedItems.push(document.activeElement?.textContent?.trim() ?? "");
      await user.keyboard("{ArrowDown}");
    }
    expect(visitedItems).toEqual(getMenuItemNames());
    // The last item keeps focus (Radix menus don't wrap by default).
    expect(document.activeElement).toHaveTextContent("Settings");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("opens with Space and names the language and theme groups", async () => {
    const user = userEvent.setup();
    renderMenu();
    screen.getByRole("button", { name: "Account, language and theme" }).focus();

    await user.keyboard(" ");

    expect(screen.getByRole("group", { name: "Language" })).toBeVisible();
    expect(screen.getByRole("group", { name: "Theme" })).toBeVisible();
    expect(
      screen.getByRole("menuitemradio", { name: "English" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemradio", { name: "Lietuvių" }),
    ).toHaveAttribute("lang", "lt");
  });

  it("switches the theme from the keyboard and stays open", async () => {
    const user = userEvent.setup();
    renderMenu();
    screen.getByRole("button", { name: "Account, language and theme" }).focus();
    await user.keyboard("{Enter}");

    // Lietuvių → English → Light → Dark
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(document.activeElement).toHaveTextContent("Dark");
    await user.keyboard("{Enter}");

    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(
      screen.getByRole("menuitemradio", { name: "System" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("opens the same page in the other language and closes", async () => {
    const user = userEvent.setup();
    renderMenu("lt", "/lt/sessions/123");
    screen.getByRole("button", { name: "Paskyra, kalba ir tema" }).focus();
    await user.keyboard("{Enter}");

    await user.keyboard("{ArrowDown}{Enter}");

    expect(replace).toHaveBeenCalledExactlyOnceWith("/en/sessions/123");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not navigate when the current language is picked", async () => {
    const user = userEvent.setup();
    renderMenu("lt", "/lt/dashboard");
    await user.click(
      screen.getByRole("button", { name: "Paskyra, kalba ir tema" }),
    );

    await user.click(screen.getByRole("menuitemradio", { name: "Lietuvių" }));

    expect(replace).not.toHaveBeenCalled();
  });

  it("links to the settings page in the current language", async () => {
    const user = userEvent.setup();
    renderMenu("lt");
    await user.click(
      screen.getByRole("button", { name: "Paskyra, kalba ir tema" }),
    );

    expect(
      screen.getByRole("menuitem", { name: "Nustatymai" }),
    ).toHaveAttribute("href", "/lt/settings");
    expect(getMenuItemNames()).toEqual([
      "Lietuvių",
      "English",
      "Šviesi",
      "Tamsi",
      "Kaip sistemoje",
      "Nustatymai",
    ]);
  });
});
