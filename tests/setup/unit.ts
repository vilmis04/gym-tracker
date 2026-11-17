import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount anything rendered by the previous test so tests stay independent.
afterEach(() => {
  cleanup();
});
