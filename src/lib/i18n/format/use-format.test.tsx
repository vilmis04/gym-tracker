import { act, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@tests/helpers/render-with-intl";

import { MESSAGES } from "../messages";
import { useFormat } from "./use-format";

const NOW = new Date("2026-11-19T12:00:00Z");
// 07:30 in Vilnius, 00:30 in New York.
const SESSION_START = new Date("2026-11-17T05:30:00Z");

const SessionSummary = () => {
  const format = useFormat();
  return (
    <p>
      {[
        format.weight(57.5),
        format.date(SESSION_START),
        format.dateTime(SESSION_START),
        format.relative(SESSION_START),
        format.duration(75),
      ].join(" | ")}
    </p>
  );
};

const stubBrowserTimeZone = (timeZone: string) => {
  const resolveOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(
    function (this: Intl.DateTimeFormat) {
      return { ...resolveOptions.call(this), timeZone };
    },
  );
};

describe("useFormat", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    {
      locale: "lt",
      text: "57,5 kg | 2026 m. lapkričio 17 d. | 2026 m. lapkričio 17 d. 07:30 | prieš 2 dienas | 1 val. 15 min.",
    },
    {
      locale: "en",
      text: "57.5 kg | November 17, 2026 | November 17, 2026 at 07:30 | 2 days ago | 1 h 15 min",
    },
  ] as const)("formats with the $locale presets", ({ locale, text }) => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    stubBrowserTimeZone("Europe/Vilnius");

    renderWithIntl(<SessionSummary />, { locale });

    expect(screen.getByRole("paragraph")).toHaveTextContent(text);
  });

  it("hydrates the server HTML without a mismatch, then shows the browser's time zone", async () => {
    const page = (
      <NextIntlClientProvider
        locale="en"
        messages={MESSAGES.en}
        timeZone="Europe/Vilnius"
        now={NOW}
      >
        <SessionSummary />
      </NextIntlClientProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(page);
    document.body.append(container);
    expect(container).toHaveTextContent("November 17, 2026 at 07:30");

    stubBrowserTimeZone("America/New_York");
    const handleRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, "error");
    await act(async () => {
      hydrateRoot(container, page, {
        onRecoverableError: handleRecoverableError,
      });
    });

    expect(container).toHaveTextContent("November 17, 2026 at 00:30");
    expect(handleRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    container.remove();
  });
});
