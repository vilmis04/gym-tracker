import { beforeEach, describe, expect, it, vi } from "vitest";

import { THEME_STORAGE_KEY } from "@/components/common/theme/theme-preferences";
import { ThemeProvider } from "@/components/common/theme/theme-provider";
import type { Locale } from "@/lib/i18n/i18n.types";
import { savePreferences } from "@/lib/profiles/save-preferences";
import { renderWithIntl } from "@tests/helpers/render-with-intl";
import { stubAppRouterAt } from "@tests/helpers/stub-app-router";

import { APPLIED_PREFERENCES_SESSION_STORAGE_KEY } from "./applied-preferences-session";
import { ApplySavedPreferences } from "./apply-saved-preferences";

import type { ApplySavedPreferencesProps } from "./preferences.types";

vi.mock("@/lib/profiles/save-preferences", () => ({
  savePreferences: vi.fn(async () => ({ ok: true, data: undefined })),
}));

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

const renderAt = (
  url: string,
  locale: Locale,
  props: Partial<ApplySavedPreferencesProps> = {},
) => {
  const { replace } = stubAppRouterAt(url);
  renderWithIntl(
    <ThemeProvider>
      <ApplySavedPreferences
        sessionId="sess_new"
        savedLocale="en"
        savedTheme="dark"
        hasSavedPreferences
        {...props}
      />
    </ThemeProvider>,
    { locale },
  );
  return { replace };
};

describe("ApplySavedPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("applies the saved language and theme once after signing in on a new device", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");

    const { replace } = renderAt("/lt/dashboard?tab=x", "lt");

    expect(replace).toHaveBeenCalledExactlyOnceWith("/en/dashboard?tab=x");
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(localStorage.getItem(APPLIED_PREFERENCES_SESSION_STORAGE_KEY)).toBe(
      "sess_new",
    );
    // Applying is not a new choice: nothing is saved back.
    expect(savePreferences).not.toHaveBeenCalled();
  });

  it("leaves this device's choice alone for the rest of the session", () => {
    localStorage.setItem(APPLIED_PREFERENCES_SESSION_STORAGE_KEY, "sess_new");
    localStorage.setItem(THEME_STORAGE_KEY, "light");

    const { replace } = renderAt("/lt/settings", "lt");

    expect(replace).not.toHaveBeenCalled();
    expect(document.documentElement).toHaveClass("light");
  });

  it("does nothing when this device already matches", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    const { replace } = renderAt("/en/sessions", "en");

    expect(replace).not.toHaveBeenCalled();
    expect(document.documentElement).toHaveClass("dark");
  });

  it("saves this device's choice when the profile has only the defaults (new user)", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    const { replace } = renderAt("/en/dashboard", "en", {
      savedLocale: "lt",
      savedTheme: "system",
      hasSavedPreferences: false,
    });

    expect(replace).not.toHaveBeenCalled();
    expect(document.documentElement).toHaveClass("dark");
    expect(savePreferences).toHaveBeenCalledExactlyOnceWith({
      locale: "en",
      theme: "dark",
    });
  });

  it("doesn't save an unknown stored theme for a new user", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "neon");

    renderAt("/lt/dashboard", "lt", { hasSavedPreferences: false });

    expect(savePreferences).toHaveBeenCalledExactlyOnceWith({
      locale: "lt",
      theme: undefined,
    });
  });

  it("never overrides the device when local storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    const { replace } = renderAt("/lt/dashboard", "lt");

    expect(replace).not.toHaveBeenCalled();
    expect(savePreferences).not.toHaveBeenCalled();
  });
});
