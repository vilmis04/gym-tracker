import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TIME_ZONE_COOKIE_NAME } from "@/lib/i18n/time-zone";

import { TimeZoneCookieWriter } from "./time-zone-cookie-writer";

const stubBrowserTimeZone = (timeZone: string) => {
  const resolveOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(
    function (this: Intl.DateTimeFormat) {
      return { ...resolveOptions.call(this), timeZone };
    },
  );
};

describe("TimeZoneCookieWriter", () => {
  afterEach(() => {
    document.cookie = `${TIME_ZONE_COOKIE_NAME}=; max-age=0; path=/`;
  });

  it("writes the browser's time zone when the cookie is missing", () => {
    stubBrowserTimeZone("America/New_York");
    const { container } = render(<TimeZoneCookieWriter />);

    expect(document.cookie).toContain(
      `${TIME_ZONE_COOKIE_NAME}=${encodeURIComponent("America/New_York")}`,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("replaces a cookie with another zone and keeps a matching one", () => {
    document.cookie = `${TIME_ZONE_COOKIE_NAME}=Europe%2FVilnius; path=/`;
    stubBrowserTimeZone("Asia/Tokyo");
    const cookieSetter = vi.spyOn(document, "cookie", "set");
    const { unmount } = render(<TimeZoneCookieWriter />);
    expect(document.cookie).toContain(
      `${TIME_ZONE_COOKIE_NAME}=${encodeURIComponent("Asia/Tokyo")}`,
    );
    // Kept for a year, like the locale cookie.
    expect(cookieSetter).toHaveBeenCalledWith(
      `${TIME_ZONE_COOKIE_NAME}=Asia%2FTokyo; path=/; max-age=31536000; SameSite=Lax`,
    );
    unmount();

    cookieSetter.mockClear();
    render(<TimeZoneCookieWriter />);
    expect(cookieSetter).not.toHaveBeenCalled();
  });
});
