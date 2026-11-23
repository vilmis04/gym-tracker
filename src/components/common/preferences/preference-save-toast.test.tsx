import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/ui/toast";
import { savePreferences } from "@/lib/profiles/save-preferences";
import { renderWithIntl } from "@tests/helpers/render-with-intl";

import { PreferenceSaveToast } from "./preference-save-toast";
import {
  saveLocaleToProfile,
  saveThemeToProfile,
  subscribeToPreferenceSaveOutcomes,
} from "./preference-saving";

vi.mock("@/lib/profiles/save-preferences", () => ({
  savePreferences: vi.fn(async () => ({ ok: true, data: undefined })),
}));

const renderToast = (locale: "en" | "lt" = "en") =>
  renderWithIntl(
    <>
      <PreferenceSaveToast />
      <Toaster />
    </>,
    { locale },
  );

describe("saving preferences from the browser", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves the language and confirms with one short toast", async () => {
    renderToast();

    act(() => saveLocaleToProfile("en"));

    expect(savePreferences).toHaveBeenCalledExactlyOnceWith({ locale: "en" });
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("replaces the toast instead of stacking one per change", async () => {
    renderToast("lt");

    act(() => saveThemeToProfile("dark"));
    act(() => saveThemeToProfile("light"));

    expect(savePreferences).toHaveBeenLastCalledWith({ theme: "light" });
    await vi.waitFor(() => expect(savePreferences).toHaveBeenCalledTimes(2));
    expect(await screen.findAllByText("Išsaugota")).toHaveLength(1);
  });

  it.each([
    ["the action fails", async () => ({ ok: false, error: "UNKNOWN" })],
    [
      "the request fails",
      async () => {
        throw new TypeError("Failed to fetch");
      },
    ],
  ])("says the change stays on this device when %s", async (_case, save) => {
    vi.mocked(savePreferences).mockImplementationOnce(save as never);
    renderToast();

    act(() => saveThemeToProfile("dark"));

    expect(
      await screen.findByText(
        "Couldn’t sync to your account. The change applies on this device only.",
      ),
    ).toBeInTheDocument();
  });

  it("hands an outcome that arrived without a listener to the next one (the page after a language switch)", async () => {
    saveLocaleToProfile("lt");
    await vi.waitFor(() => expect(savePreferences).toHaveBeenCalled());
    await act(async () => {});

    renderToast("lt");

    expect(await screen.findByText("Išsaugota")).toBeInTheDocument();
  });

  it("drops an outcome nobody listened to within 5 s", async () => {
    vi.useFakeTimers({ now: 0, toFake: ["Date"] });
    saveThemeToProfile("dark");
    await vi.waitFor(() => expect(savePreferences).toHaveBeenCalled());
    await act(async () => {});
    vi.setSystemTime(Date.now() + 5001);

    const listener = vi.fn();
    const unsubscribe = subscribeToPreferenceSaveOutcomes(listener);
    unsubscribe();

    expect(listener).not.toHaveBeenCalled();
  });
});
