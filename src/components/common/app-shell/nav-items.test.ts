import { describe, expect, it } from "vitest";

import { getAppPath, isNavItemActive, NAV_ITEMS } from "./nav-items";

describe("NAV_ITEMS", () => {
  it("lists Home (the dashboard route), Sessions, Progress and Buddies", () => {
    expect(NAV_ITEMS.map(({ section, segment }) => [section, segment])).toEqual(
      [
        ["home", "dashboard"],
        ["sessions", "sessions"],
        ["progress", "progress"],
        ["buddies", "buddies"],
      ],
    );
    expect(getAppPath("lt", "sessions")).toBe("/lt/sessions");
  });
});

describe("isNavItemActive", () => {
  it.each([
    ["/lt/sessions", "/lt/sessions", true],
    ["/lt/sessions/123", "/lt/sessions", true],
    ["/en/progress/exercise/abc", "/en/progress", true],
    ["/en/progress/session/abc", "/en/progress", true],
    ["/lt/sessions-archive", "/lt/sessions", false],
    ["/lt/settings", "/lt/dashboard", false],
    ["/en/sessions", "/lt/sessions", false],
  ])("%s with %s → %s", (pathname, itemHref, isActive) => {
    expect(isNavItemActive(pathname, itemHref)).toBe(isActive);
  });
});
