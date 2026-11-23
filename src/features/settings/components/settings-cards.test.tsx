import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountContext } from "@/components/common/auth/account-context";
import type { Account } from "@/components/common/auth/auth.types";
import {
  saveLocaleToProfile,
  saveThemeToProfile,
} from "@/components/common/preferences/preference-saving";
import { ThemeProvider } from "@/components/common/theme/theme-provider";
import type { Locale } from "@/lib/i18n/i18n.types";
import { renderWithIntl } from "@tests/helpers/render-with-intl";
import { stubAppRouterAt } from "@tests/helpers/stub-app-router";
import { createTestAccount } from "@tests/helpers/test-account";

import { AccountCard } from "./account-card";
import { PreferencesCard } from "./preferences-card";
import { SignOutButton } from "./sign-out-button";
import { YourDataCard } from "./your-data-card";

vi.mock("@/components/common/preferences/preference-saving", () => ({
  saveLocaleToProfile: vi.fn(),
  saveThemeToProfile: vi.fn(),
}));

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

const renderSettings = (
  locale: Locale = "en",
  account: Account | null = createTestAccount(),
) => {
  const { replace } = stubAppRouterAt(`/${locale}/settings`);
  renderWithIntl(
    <AccountContext value={account}>
      <ThemeProvider>
        <AccountCard
          name="Rūta Žemaitė"
          email="ruta+clerk_test@example.com"
          avatarUrl={null}
        />
        <PreferencesCard />
        <YourDataCard />
        <SignOutButton />
      </ThemeProvider>
    </AccountContext>,
    { locale },
  );
  return { replace, account };
};

describe("settings page sections", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("has one heading per section", () => {
    renderSettings();

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map(({ textContent }) => textContent?.trim()),
    ).toEqual(["Account", "Preferences", "Your data"]);
  });

  it("shows the name and email as text that can't be edited", () => {
    renderSettings();

    expect(screen.getByText("Rūta Žemaitė")).toBeInTheDocument();
    expect(screen.getByText("ruta+clerk_test@example.com")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Managed by Google: your name, email and photo come from your Google account.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    // The initials avatar is decorative: the name is written next to it.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("opens Clerk's account management", async () => {
    const user = userEvent.setup();
    const { account } = renderSettings();

    await user.click(screen.getByRole("button", { name: "Manage account" }));

    expect(account?.openAccountManagement).toHaveBeenCalledOnce();
  });

  it("switches and saves the language and the theme", async () => {
    const user = userEvent.setup();
    const { replace } = renderSettings("lt");

    await user.click(screen.getByRole("radio", { name: "Tamsi" }));
    await user.click(screen.getByRole("radio", { name: "English" }));

    expect(document.documentElement).toHaveClass("dark");
    expect(saveThemeToProfile).toHaveBeenCalledExactlyOnceWith("dark");
    expect(replace).toHaveBeenCalledExactlyOnceWith("/en/settings");
    expect(saveLocaleToProfile).toHaveBeenCalledExactlyOnceWith("en");
  });

  it("names the language and theme groups in Lithuanian", () => {
    renderSettings("lt");

    expect(screen.getByRole("group", { name: "Kalba" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Tema" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Lietuvių" })).toBeChecked();
  });

  it("shows export and deletion as coming soon, not usable yet", () => {
    renderSettings();

    expect(screen.getByText(/^Coming soon:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export data" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Delete account" }),
    ).toBeDisabled();
  });

  it("signs out to the landing page of the current language", async () => {
    const user = userEvent.setup();
    const { account } = renderSettings("lt");

    await user.click(screen.getByRole("button", { name: "Atsijungti" }));

    expect(account?.signOut).toHaveBeenCalledExactlyOnceWith("/lt");
  });

  it("disables the account buttons until Clerk has loaded the user", () => {
    renderSettings("en", null);

    expect(
      screen.getByRole("button", { name: "Manage account" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeDisabled();
  });
});
