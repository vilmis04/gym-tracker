import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount anything rendered by the previous test so tests stay independent.
afterEach(() => {
  cleanup();
});

// Browser APIs jsdom lacks (skipped in `@vitest-environment node` files).
// Defined on the prototypes / window (not with vi.stubGlobal), so tests can
// still stub them and get these back afterwards.
if (typeof window !== "undefined") {
  // cmdk (Combobox) keeps the active option in view and measures its list.
  Element.prototype.scrollIntoView = function scrollIntoView() {};
  window.ResizeObserver = class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // useMediaQuery: nothing matches (the phone layout) unless a test stubs it.
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
