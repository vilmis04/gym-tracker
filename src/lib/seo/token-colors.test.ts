// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { readTokenColors } from "./token-colors";

vi.mock("server-only", () => ({}));

// A hash and six lowercase hex digits, e.g. "#" + "5e7152".
const HEX_COLOR_REGEX = /^#[\da-f]{6}$/;

describe("readTokenColors", () => {
  it("reads the light and dark values of a token from globals.css as hex", async () => {
    const [getLightColor, getDarkColor] = await Promise.all([
      readTokenColors("light"),
      readTokenColors("dark"),
    ]);

    expect(getLightColor("background")).toMatch(HEX_COLOR_REGEX);
    expect(getLightColor("primary")).not.toBe(getDarkColor("primary"));
  });

  it("resolves aliases such as --primary-foreground", async () => {
    const getColor = await readTokenColors("light");

    expect(getColor("primary-foreground")).toBe(getColor("background"));
  });

  it("throws for an unknown or translucent token", async () => {
    const getColor = await readTokenColors("light");

    expect(() => getColor("no-such-token")).toThrow(/--no-such-token/);
    expect(() => getColor("scrim")).toThrow(/opaque/);
  });
});
