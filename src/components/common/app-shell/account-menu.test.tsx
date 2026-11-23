import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountContext } from "@/components/common/auth/account-context";
import type { Account } from "@/components/common/auth/auth.types";
import { ThemeProvider } from "@/components/common/theme/theme-provider";
import type { Locale } from "@/lib/i18n/i18n.types";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locales";
import { renderWithIntl } from "@tests/helpers/render-with-intl";
import { stubAppRouterAt } from "@tests/helpers/stub-app-router";

import { AccountMenu } from "./account-menu";

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

const renderMenu = (
  locale: Locale = "en",
  url = `/${locale}/sessions/123`,
  account: Account | null = createSignedInAccount(),
) => {
  const { replace } = stubAppRouterAt(url);
  renderWithIntl(
    <AccountContext value={account}>
      <ThemeProvider>
        <AccountMenu />
      </ThemeProvider>
    </AccountContext>,
    { locale },
  );
  return { replace, account };
};

const createSignedInAccount = (): Account => ({
  user: {
    name: "Rūta Žemaitė",
    email: "ruta+clerk_test@example.com",
    imageUrl: null,
  },
  signOut: vi.fn(async () => {}),
});

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
    document.cookie = `${LOCALE_COOKIE_NAME}=; max-age=0; path=/`;
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
      "Sign out",
    ]);
    const visitedItems: string[] = [];
    for (let i = 0; i < 7; i++) {
      visitedItems.push(document.activeElement?.textContent?.trim() ?? "");
      await user.keyboard("{ArrowDown}");
    }
    expect(visitedItems).toEqual(getMenuItemNames());
    // The last item keeps focus (Radix menus don't wrap by default).
    expect(document.activeElement).toHaveTextContent("Sign out");

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

  it("opens the same page and query in the other language, saves the cookie and closes", async () => {
    const user = userEvent.setup();
    const { replace } = renderMenu("lt", "/lt/sessions/123?tab=x");
    screen.getByRole("button", { name: "Paskyra, kalba ir tema" }).focus();
    await user.keyboard("{Enter}");

    await user.keyboard("{ArrowDown}{Enter}");

    expect(replace).toHaveBeenCalledExactlyOnceWith("/en/sessions/123?tab=x");
    expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=en`);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not navigate when the current language is picked", async () => {
    const user = userEvent.setup();
    const { replace } = renderMenu("lt", "/lt/dashboard");
    await user.click(
      screen.getByRole("button", { name: "Paskyra, kalba ir tema" }),
    );

    await user.click(screen.getByRole("menuitemradio", { name: "Lietuvių" }));

    expect(replace).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain(LOCALE_COOKIE_NAME);
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
      "Atsijungti",
    ]);
  });

  it("shows the signed-in user on the button and at the top of the menu", async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole("button", {
      name: "Account, language and theme",
    });

    // Initials on a pastel fill (no photo); the button keeps its own name.
    expect(trigger).toHaveTextContent("RŽ");
    await user.click(trigger);

    expect(screen.getByRole("menu")).toHaveTextContent(
      /^Rūta Žemaitėruta\+clerk_test@example\.com/,
    );
  });

  it("signs out to the landing page of the current language", async () => {
    const user = userEvent.setup();
    const { account } = renderMenu("lt", "/lt/sessions");
    await user.click(
      screen.getByRole("button", { name: "Paskyra, kalba ir tema" }),
    );

    await user.click(screen.getByRole("menuitem", { name: "Atsijungti" }));

    expect(account?.signOut).toHaveBeenCalledExactlyOnceWith("/lt");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows the icon and a disabled sign out until Clerk has loaded the user", async () => {
    const user = userEvent.setup();
    renderMenu("en", "/en/sessions", null);
    const trigger = screen.getByRole("button", {
      name: "Account, language and theme",
    });

    expect(trigger).toHaveTextContent("");
    await user.click(trigger);

    expect(screen.getByRole("menuitem", { name: "Sign out" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(getMenuItemNames()[0]).toBe("Lietuvių");
  });
});
