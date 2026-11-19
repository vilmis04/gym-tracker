import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));
const tests = fileURLToPath(new URL("./tests", import.meta.url));
const emptyModule = fileURLToPath(
  new URL("./tests/setup/empty-module.ts", import.meta.url),
);

/**
 * Two Vitest projects (see tests/README.md):
 * - `unit`: components and logic in jsdom, no network. `npm test`.
 * - `db`: RLS/database tests in Node against local Supabase. `npm run test:db`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": src,
      // Shared test helpers for tests next to the code (`@tests/helpers/…`).
      "@tests": tests,
      // `server-only` throws outside a React Server bundle; tests run plain Node.
      "server-only": emptyModule,
    },
  },
  test: {
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    server: {
      deps: {
        // next-intl's ESM build imports `next/server` without the `.js`
        // extension, which only a bundler resolves; let Vite process it.
        inline: ["next-intl"],
      },
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/__typetests__/**",
        "src/**/*.test.{ts,tsx}",
        "src/types/database.ts",
        // Browser Sentry init (E01-T07); covered by tests/e2e/error-tracking.spec.ts.
        "src/instrumentation-client.ts",
      ],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
          setupFiles: ["tests/setup/unit.ts"],
          // Tailwind runs as a Turbopack loader; tests never process CSS.
          css: false,
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          environment: "node",
          include: ["tests/db/**/*.test.ts"],
          globalSetup: ["tests/setup/db-global.ts"],
          setupFiles: ["tests/setup/db.ts"],
          // Every test truncates the user-data tables, so files must not run
          // in parallel against the one local database.
          fileParallelism: false,
          testTimeout: 15_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
