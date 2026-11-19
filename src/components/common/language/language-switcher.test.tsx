import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Locale } from "@/lib/i18n/i18n.types";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locales";
import { renderWithIntl } from "@tests/helpers/render-with-intl";
import { stubAppRouterAt } from "@tests/helpers/stub-app-router";

import { LanguageSwitcher } from "./language-switcher";

import type { OnLocaleChange } from "./language.types";

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

const renderSwitcher = ({
  locale,
  url,
  onLocaleChange,
}: {
  locale: Locale;
  url: string;
  onLocaleChange?: OnLocaleChange;
}) => {
  const { replace } = stubAppRouterAt(url);
  renderWithIntl(<LanguageSwitcher onLocaleChange={onLocaleChange} />, {
    locale,
  });
  return { replace };
};

const getLocaleCookie = () =>
  document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split("=")[1];

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; max-age=0; path=/`;
  });

  it("is a labelled radio group of native names with the current language checked", () => {
    renderSwitcher({ locale: "lt", url: "/lt" });

    expect(screen.getByRole("group", { name: "Kalba" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Lietuvių" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "English" })).not.toBeChecked();
    expect(screen.getByText("Lietuvių").closest("label")).toHaveAttribute(
      "lang",
      "lt",
    );
    expect(screen.getByText("English").closest("label")).toHaveAttribute(
      "lang",
      "en",
    );
  });

  it("opens the same path and query in the picked language, saves the cookie and calls the save hook", async () => {
    const onLocaleChange = vi.fn<OnLocaleChange>();
    const user = userEvent.setup();
    const { replace } = renderSwitcher({
      locale: "lt",
      url: "/lt/sessions/123?tab=x",
      onLocaleChange,
    });

    await user.click(screen.getByRole("radio", { name: "English" }));

    expect(replace).toHaveBeenCalledExactlyOnceWith("/en/sessions/123?tab=x");
    expect(getLocaleCookie()).toBe("en");
    expect(onLocaleChange).toHaveBeenCalledExactlyOnceWith("en");
  });

  it("is operable with the keyboard: Tab focuses the current language, arrows switch", async () => {
    const user = userEvent.setup();
    const { replace } = renderSwitcher({ locale: "en", url: "/en" });

    await user.tab();
    expect(screen.getByRole("radio", { name: "English" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");

    expect(replace).toHaveBeenCalledExactlyOnceWith("/lt");
    expect(getLocaleCookie()).toBe("lt");
  });

  it("keeps the query on the landing page", async () => {
    const user = userEvent.setup();
    const { replace } = renderSwitcher({ locale: "lt", url: "/lt?ref=mail" });

    await user.click(screen.getByRole("radio", { name: "English" }));

    expect(replace).toHaveBeenCalledExactlyOnceWith("/en?ref=mail");
  });

  it("does nothing for the current language", async () => {
    const onLocaleChange = vi.fn<OnLocaleChange>();
    const user = userEvent.setup();
    const { replace } = renderSwitcher({
      locale: "en",
      url: "/en/dashboard",
      onLocaleChange,
    });

    await user.click(screen.getByRole("radio", { name: "English" }));

    expect(replace).not.toHaveBeenCalled();
    expect(onLocaleChange).not.toHaveBeenCalled();
    expect(getLocaleCookie()).toBeUndefined();
  });
});
