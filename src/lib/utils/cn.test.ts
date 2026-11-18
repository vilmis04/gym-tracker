import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("joins conditional class names", () => {
    expect(
      cn("flex", false, null, undefined, ["gap-2"], { "font-medium": true }),
    ).toBe("flex gap-2 font-medium");
  });

  it("lets later classes win Tailwind conflicts, including token colors", () => {
    expect(cn("px-4 text-sm", "px-6")).toBe("text-sm px-6");
    expect(cn("bg-primary text-primary-foreground", "bg-destructive")).toBe(
      "text-primary-foreground bg-destructive",
    );
    expect(cn("text-sm text-muted-foreground", "text-foreground")).toBe(
      "text-sm text-foreground",
    );
  });
});
