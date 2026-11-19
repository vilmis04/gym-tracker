# Tests

Three levels, each with its own command. All of them run on a clean checkout (`npm ci`); the DB tests also need the local Supabase stack.

| Level           | Tool                                            | Where                                   | Command                                      |
| --------------- | ----------------------------------------------- | --------------------------------------- | -------------------------------------------- |
| Unit, component | Vitest + React Testing Library + jsdom          | next to the code: `src/**/*.test.ts(x)` | `npm test` · `npm run test:watch`            |
| Database, RLS   | Vitest (Node) against local Supabase            | `tests/db/**/*.test.ts`                 | `npm run test:db` (after `npm run db:start`) |
| End-to-end      | Playwright: desktop Chromium + WebKit iPhone 14 | `tests/e2e/**/*.spec.ts`                | `npm run e2e` · `npm run e2e:ui`             |

CI runs all three on every PR (see [docs/ci.md](../docs/ci.md)): unit with coverage, DB tests on a fresh local Supabase stack, e2e on both projects against the production build.

Coverage for unit tests: `npm run test:coverage` (V8; text summary in the terminal, HTML in `coverage/index.html`, `coverage/lcov.info` for CI).

```
tests/
  README.md            this file
  factories/           test data builders: createUser(), later createSession(), …
  helpers/             shared helpers: signed-JWT Supabase clients, DB reset, local stack settings, renderWithIntl() (next-intl provider for component tests), stubAppRouterAt() (App Router hooks at a URL)
  setup/               Vitest setup files (jest-dom, DB env + reset, `server-only` stub)
  db/rls/              RLS tests, one file per table
  unit/scripts/        tests for scripts/ (deploy scripts against a local fake Coolify/health server, raw-color guard, token contrast check, translations check)
  e2e/                 Playwright specs, global setup and e2e helpers (signInAs)
```

## Unit and component tests

- Put `*.test.ts` / `*.test.tsx` next to the code they test (`src/app/[locale]/(public)/page.test.tsx`, `src/lib/supabase/env.test.ts`). Import `describe`/`it`/`expect`/`vi` from `vitest` (no globals).
- Query the DOM like a user: `screen.getByRole("button", { name: … })` first, `getByText` next, test ids last. Use `@testing-library/user-event` for interactions. jest-dom matchers (`toBeInTheDocument`, `toBeVisible`, …) are loaded in `tests/setup/unit.ts`.
- No network, no database. Mock at the module boundary with `vi.mock()`; mocks, spies and `vi.stubEnv()` are reset after every test (`restoreMocks`, `unstubEnvs` in `vitest.config.mts`).
- `server-only` is aliased to an empty module, so server code (`@/lib/supabase/server`, Server Actions, `withAction()` later) can be imported and unit tested. Async Server Components can't be rendered by RTL; test their logic (queries, actions) directly, and cover the page in e2e.
- **Translations (next-intl):** render components that call `useTranslations` / `useLocale` with `renderWithIntl(ui, { locale: "en" })` from `@tests/helpers/render-with-intl` (default locale `lt`): it wraps them in a real `NextIntlClientProvider` with the real messages, so tests assert on the actual EN / LT text and need no next-intl mock. `@tests/*` is a path alias for `tests/` (tsconfig + Vitest). `next-intl/server` resolves to next-intl's throwing client stub in Vitest (no `react-server` condition), so async Server Components stay e2e-tested; mock it at the boundary where server code needs it (`src/lib/i18n/request.test.ts` mocks `getRequestConfig` and `next/root-params`). Vitest inlines `next-intl` (`server.deps.inline`) because its ESM build imports `next/server` without the extension.
- **Sentry:** code that reports errors (`withAction()`, `global-error.tsx`) imports `@sentry/nextjs`; stub it with `vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }))` and assert on `Sentry.captureException`. Put `// @vitest-environment node` at the top of tests for server code (Server Actions, `withAction()`).
- **Shell scripts** (`scripts/*.sh`) are tested in `tests/unit/scripts/` by running them with `bash` against a local fake HTTP server (no real network). They need `bash`, `curl` and `jq`.
- CSS is not processed (Tailwind runs as a Turbopack loader in the app only). Type-level tests in `src/**/__typetests__` are checked by `npm run typecheck`, not Vitest.
- **Browser APIs jsdom lacks** are stubbed in `tests/setup/unit.ts` for jsdom files: `Element.prototype.scrollIntoView` and `ResizeObserver` (cmdk) and `window.matchMedia` (never matches, i.e. the phone layout; stub it per test with `vi.spyOn(window, "matchMedia")`, see `combobox.test.tsx`).
- **Fake timers with user-event:** `vi.useFakeTimers()`, `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` and `vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime })` — Testing Library only advances fake timers through a global `jest` and otherwise hangs; `vi.unstubAllGlobals()` afterwards. Advance with `await act(() => vi.advanceTimersByTimeAsync(ms))` (the Combobox debounce / stale-result tests, the NumberStepper press-and-hold tests: hold with `user.pointer({ keys: "[MouseLeft>]", target })`, release with `user.pointer({ keys: "[/MouseLeft]" })`).

## Database and RLS tests

Run against the **local** Supabase stack only:

```bash
npm run db:start   # once; needs Docker
npm run test:db
```

**How a test acts as a user.** `createUser()` (`tests/factories`) builds a fake Clerk-style user (`user_test…` id, `+clerk_test` email). `createClientAs(user)` (`tests/helpers/supabase-auth.ts`) signs a JWT with the same claims the Clerk session token carries once Clerk is a Supabase third-party auth provider — `sub` = Clerk user id, `role` and `aud` = `authenticated` — using the local stack's JWT secret (HS256, via `jose`), and returns the app's own `createServerClient({ accessToken })`. So the query goes through PostgREST and RLS exactly like a real request; `auth.jwt()->>'sub'` is the fake user's id. `createAnonClient()` is a signed-out request; `createServiceClient()` bypasses RLS and is only for arranging or checking data, never as the actor under test.

```ts
const alice = createUser();
const bob = createUser();
const asAlice = await createClientAs(alice);
await asAlice.from("sample_notes").insert({ body: "mine" });

const asBob = await createClientAs(bob);
const { data } = await asBob.from("sample_notes").select("id");
expect(data).toEqual([]); // RLS hides Alice's row
```

The example is `tests/db/rls/sample-notes.test.ts` (owner reads own row; user B can't read, update or delete user A's row; inserting for someone else fails with `42501`; anon sees nothing). Every new table gets a file like it (Definition of Done: "RLS policies + RLS tests included").

**Known state, any order.** Before **each** test, `resetDatabase()` (`tests/helpers/db.ts`, wired in `tests/setup/db.ts`) truncates every table in `public` (`truncate … restart identity cascade`, as the `postgres` superuser) except the seeded reference tables listed in `SEEDED_TABLES` — add tables filled by `supabase/seed.sql` there when they appear. New tables are picked up automatically. Because all files share one database, DB test files run one at a time (`fileParallelism: false`); tests also use fresh random user ids, so nothing depends on run order. Schema changes still need `npm run db:reset` (rebuild from migrations) before running the tests.

**Where the settings come from.** `tests/setup/db-global.ts` resolves them once per run:

1. If all of these are set, they are used (CI): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_DB_URL`.
2. Otherwise they are read from `npx supabase status -o env` (`API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `JWT_SECRET`, `DB_URL`), so locally nothing needs configuring. `.env.local` is **not** read.

The run aborts if the API or database host isn't `127.0.0.1`/`localhost`: these tests truncate tables and must never touch staging or production.

## End-to-end tests

```bash
npm run e2e                                # both projects
npm run e2e -- --project chromium-desktop  # one project
npm run e2e:ui                             # Playwright UI mode
```

- **Projects:** `chromium-desktop` (Desktop Chrome) and `webkit-mobile` (iPhone 14 viewport, touch, WebKit ≈ iOS Safari).
- **Browsers:** install once with `npx playwright install chromium webkit` (CI: `npx playwright install --with-deps chromium webkit`). If browsers for a different Playwright version are preinstalled (e.g. in a sandbox), point Chromium at one with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome`.
- **Server:** Playwright starts the app itself. Locally it runs `npm run dev` (and reuses a dev server already running on the port); with `CI` set it runs `npm run build && npm run start` to test the production build. `E2E_PORT` changes the port (default 3000); `E2E_BASE_URL` skips the web server and tests an already deployed URL (e.g. a Coolify preview).
- **Reports:** `playwright-report/` (HTML, `npx playwright show-report`) and `test-results/` (traces on first retry, screenshots on failure). All git-ignored.
- **Data:** e2e tests use the app's normal Supabase settings from `.env.local`. Specs that write data must create their own records with unique names (factories) so they don't depend on each other or on run order.

### Error tracking (fake Sentry)

`tests/e2e/design-tokens.spec.ts` (E02-T01) opens `/dev/tokens` and checks that the Lithuanian letters are covered by a loaded Inter font face (no fallback font) and that the theme toggle applies the dark tokens. Against a production build it needs `ENABLE_DEV_PAGES=1` (set in the CI e2e job); with `next dev` it always runs.

`tests/e2e/theme.spec.ts` (E02-T02) covers the theme acceptance criteria on the home page: switching applies at once without a reload (body background and `<meta name="theme-color">`), the choice survives a reload and a "browser restart" (a new context with the same storage state), `system` follows `emulateMedia({ colorScheme })` live, and the stored dark theme is there before hydration: once with every `/_next/static` script blocked (the inline next-themes script alone must apply it) and once with slow bundles while recording the body color on every animation frame. Keyboard and ARIA details are unit-tested in `src/components/common/theme/theme-toggle.test.tsx` (real next-themes provider, stubbed `matchMedia`).

`tests/e2e/ui-components.spec.ts` (E02-T03) opens `/dev/ui`: every component renders in both themes, keyboard focus draws the `--ring` indicator on buttons, inputs, tabs, the chip ×, the menu trigger and segmented options, the Sheet is a bottom sheet at 390 px that traps focus, closes on `Esc` and returns focus, and every button, link, tab, segmented option and menu item is at least 44 × 44 px at 390 px. Its last test starts a **second** `next start` of the existing production build (`.next`, port `E2E_PROD_CHECK_PORT`, default 3999) without `ENABLE_DEV_PAGES` and checks `/dev/ui` and `/dev/tokens` answer 404; it is skipped when there is no production build (locally: `npm run build` first). Component behavior (Dialog/Sheet focus trap, `Esc`, focus return; removable Chip by click and Delete/Backspace; Button loading; Toast 4 s auto-dismiss; Tabs, SegmentedControl and DropdownMenu keyboard) is unit-tested next to each component in `src/components/ui/`. Radix and sonner run in jsdom without polyfills as long as tests use the keyboard or `user.click`; sonner's swipe handler calls `setPointerCapture`, which jsdom lacks, so press its buttons with the keyboard.

`tests/e2e/number-stepper.spec.ts` (E02-T05) uses the NumberStepper demos on `/dev/ui`: typing `60.5` in the LT field shows `60,5` and `60,5` in the EN field shows `60.5` (both `aria-valuenow="60.5"`), values are clamped on blur / Enter and invalid text reverts, holding + for 2 s makes more steps in the second second than in the first and stops on release (announced once), and `inputmode` is `decimal` / `numeric` (whether the phone really shows the keypad is a manual check on a device). Several components on `/dev/ui` now have a `role="status"` live region, so scope `getByRole("status")` to the component (the Combobox spec uses the popover's).

`tests/e2e/app-layout.spec.ts` (E02-T06) covers the app shell on the placeholder `(app)` pages (no Clerk needed): the active section is highlighted (`aria-current`, `--primary` text in the bottom nav at 390 px, `--primary-soft` fill in the sidebar at 1440 px) and clicking moves between sections; no horizontal scroll at 360 / 390 / 768 / 1024 / 1440 px on every section in both locales; the bottom nav is 76 px + the emulated home-indicator inset and its items sit above it, and the page is padded below the emulated notch (chromium only: `Emulation.setSafeAreaInsetsOverride` over CDP); hidden scroll bars, `viewport-fit=cover`, 404 for an unknown locale, the skip link; EN / LT nav labels, headings, `<title>` and `lang`; the avatar menu by keyboard (language switch keeps the path, theme radio items, End → Settings, back link). Radix moves menu focus in a timeout after each key, so press the next key only after asserting focus (`pressAndExpectFocus`). Loading skeletons and error pages are unit-tested (`src/app/[locale]/(app)/section-boundaries.test.tsx`, `src/components/common/page/`) instead of forcing a slow or failing page in e2e. Components that read the route are tested with `vi.mock(import("next/navigation"), async (importOriginal) => ({ ...(await importOriginal()), usePathname: vi.fn(), useRouter: vi.fn() }))` (partial: next-intl's navigation in `src/lib/i18n/navigation.ts` needs the real `redirect`) and `stubAppRouterAt(url)` from `@tests/helpers/stub-app-router` (sets `window.location`, `usePathname()` and a `useRouter().replace` spy, returned); the locale comes from `renderWithIntl()` (see Unit and component tests). The avatar menu helpers (`openAccountMenuWithKey`, `pressAndExpectFocus`) are in `tests/e2e/helpers/account-menu.ts`. Since E03-T01 the `lang` check is on `<html>`, and `/de/dashboard` is first redirected to `/en/de/dashboard` (the browser's locale) before the 404.

`tests/e2e/locale-routing.spec.ts` (E03-T01) covers the proxy and the localized root layout: `/` opens `/lt` for an `lt-LT` browser, `/en` for `en-GB` and `/lt` for `de-DE` (Playwright's `locale` option sets `Accept-Language`); a `NEXT_LOCALE` cookie beats `Accept-Language`; the URL's locale beats the cookie and replaces it; a path without a locale keeps its path and query (`/sessions?tab=planned` → `/en/sessions?tab=planned`); `<html lang>`, `<title>` and the meta description in both languages, with a translated client component (ThemeToggle); and the localized 404 for `/lt/nothing-here`. The same detection rules, the matcher (which paths skip the proxy) and the cookie's max age are unit-tested in `src/proxy.test.ts` with `next/experimental/testing/server`. `tests/e2e/language-switcher.spec.ts` (E03-T02) switches with the keyboard in the avatar menu on `/lt/sessions?tab=x` (→ `/en/sessions?tab=x`, `<html lang="en">`, `NEXT_LOCALE=en` kept for a year, English checked, kept after a reload, then `/` and `/dashboard` open in EN in an `lt-LT` browser) and with the landing page switcher (`/en?ref=mail` → `/lt?ref=mail` by arrow key, Lithuanian checked, `/` opens `/lt` in an `en-GB` browser). The switch itself (path, query, cookie, save hook) is unit-tested in `src/components/common/language/language-switcher.test.tsx` and `account-menu.test.tsx`. `tests/e2e/home.spec.ts` and `theme.spec.ts` open `/en` (or `/`, which redirects there for the projects' `en-US` browsers).

`tests/e2e/formatting.spec.ts` (E03-T03; needs `ENABLE_DEV_PAGES=1` against a production build, like the other `/dev` specs) opens `/dev/format` with Playwright's `timezoneId: "America/New_York"` and fails on any console error or warning or uncaught error (React reports hydration mismatches there; failed requests to the fake Sentry DSN are ignored): on the first visit the server lists show Vilnius time and the client lists New York time after hydrating, the browser writes `TIME_ZONE=America%2FNew_York`, and after a reload every server text equals its client twin (Node's and Chromium's ICU agree) in both locales. The presets themselves are unit-tested in `src/lib/i18n/format/` with a fixed `now`: `create-format-presets.test.ts` (every preset, both locales), `use-format.test.tsx` (renders to a string, then `hydrateRoot()`s it with another browser zone and expects no recoverable error), `get-format.test.ts` (node environment; mocks `next/headers` `cookies()` and `next-intl/server`); plurals in `src/lib/i18n/messages.test.ts`. Stub the browser's zone with `vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")` (keep the other fields), and freeze time with `vi.useFakeTimers({ now, toFake: ["Date"] })` (next-intl's `useNow()` reads `new Date()`). Lithuanian digit groups use a no-break space (`"1\u00a0250,5 kg"`). Components with default labels (Button, Dialog, Sheet, Chip, AvatarStack, Combobox, NumberStepper) now read the `ui` messages, so render them with `renderWithIntl()`.

`tests/e2e/error-tracking.spec.ts` (chromium only) checks that an error thrown in a Server Component and one thrown in a client component (`/debug/error`) both reach error tracking with the release (`APP_VERSION`), a stack trace, and the fake email in the message scrubbed. No Sentry account is involved: the app is built with `NEXT_PUBLIC_SENTRY_DSN=http://public@127.0.0.1:8999/1` and the spec starts a fake ingest server on that port (`helpers/fake-sentry.ts`) that records the envelopes. The CI e2e job sets `NEXT_PUBLIC_SENTRY_DSN`, `ENABLE_TEST_ERROR_PAGE=1` and `APP_VERSION`; without them the spec is skipped. Run it locally with the command in README → Error tracking.

### Signing in (Clerk)

`signInAs(page, user)` in `tests/e2e/helpers/sign-in.ts` signs a user in **without the Google consent screen**, using [`@clerk/testing`](https://clerk.com/docs/testing/playwright/overview):

1. `tests/e2e/global-setup.ts` calls `clerkSetup()`, which fetches a Clerk **testing token** (bypasses bot protection) with the dev instance keys.
2. `signInAs` opens `/`, waits for Clerk to load and calls `clerk.signIn({ page, emailAddress })`: Clerk's Backend API creates a sign-in token for that user and the page completes a `ticket` sign-in. This works although the instance only enables Google, because sign-in tokens don't depend on enabled strategies.

```ts
import { hasClerkTestKeys, MISSING_CLERK_KEYS_REASON } from "./helpers/clerk";
import { e2eUser, signInAs } from "./helpers/sign-in";

test.skip(!hasClerkTestKeys(), MISSING_CLERK_KEYS_REASON);

test("shows my sessions", async ({ page }) => {
  await signInAs(page, e2eUser, { path: "/en/sessions" });
  // …
});
```

Needs:

- `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` of the Clerk **dev** instance (in `.env.local`, which `playwright.config.ts` loads, or in the environment). Never production keys — `clerkSetup()` refuses them.
- A test user in the dev instance: create `e2e-user+clerk_test@example.com` once in the Clerk dashboard (Users → Create user), or set `E2E_CLERK_USER_EMAIL` to another `+clerk_test` address. `+clerk_test` addresses never receive real mail.
- The app must load Clerk (`<ClerkProvider>`), which arrives in **E04-T01**.

Without the keys, Clerk-dependent specs are skipped with a clear reason; `tests/e2e/sign-in.spec.ts` is the example and `tests/e2e/home.spec.ts` (placeholder page loads) always runs. **Until E04-T01 the sign-in example is skipped everywhere**; E04-T01/T02 set the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` repository secrets, which the CI e2e job already passes through (see [docs/ci.md](../docs/ci.md#secrets-and-variables)).

## Writing tests

- Each test arranges its own data with factories; never rely on another test's leftovers or on order.
- New table → RLS test file in `tests/db/rls/`. New logic → unit test next to it. Changed user flow → update or add an e2e spec (Definition of Done).
- Keep tests lint- and type-clean: they are part of `npm run lint` and `npm run typecheck`.
