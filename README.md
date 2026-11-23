# Gym Tracker

Track gym sessions together with your gym buddies: log weights, reps and notes for everyone in the session and follow progress over time.

Stack: Next.js · Clerk (Google login) · Supabase · Tailwind. Languages: EN / LT. Light and dark themes.

See [docs/](docs/README.md) for the product vision, architecture, data model, design system, roadmap and backlog.

## Prerequisites

- **Node.js 22** (LTS, 22.22.2 or newer) — the exact major is pinned in [`.nvmrc`](.nvmrc); with nvm run `nvm use`
- **npm 10+** (ships with Node 22)
- Git
- **Docker** (Docker Desktop, OrbStack, Colima or Docker Engine) — runs the local Supabase stack

## Getting started

```bash
git clone https://github.com/vilmis04/gym-tracker.git
cd gym-tracker
nvm use        # optional, picks Node from .nvmrc
npm ci         # install exact versions from package-lock.json
cp .env.example .env.local   # then fill in values (see below)
npm run db:start             # start local Supabase in Docker (first run pulls images)
npm run dev    # start the dev server
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/lt` or `/en` (your browser language) and shows the placeholder page. The app shell with its placeholder sections is at [/lt/dashboard](http://localhost:3000/lt/dashboard) (or `/en/…`) and needs a signed-in user: set the Clerk **dev** instance keys in `.env.local` ([Authentication](#authentication-clerk)). Without them the app still runs, but every signed-in page sends you to a sign-in page that says sign-in isn't available.

## Scripts

| Script                   | What it does                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `npm run dev`            | Start the Next.js dev server on port 3000                                            |
| `npm run build`          | Production build                                                                     |
| `npm start`              | Serve the production build (run `build` first)                                       |
| `npm run docker:build`   | Build the production Docker image `gym-tracker` (see [Docker](#docker))              |
| `npm run docker:run`     | Run the image on port 3000 with `.env.local` as runtime env                          |
| `npm run lint`           | ESLint; fails on any warning (`--max-warnings 0`)                                    |
| `npm run typecheck`      | Generate Next.js route types, then `tsc --noEmit`                                    |
| `npm run format`         | Format all files with Prettier (sorts Tailwind classes)                              |
| `npm run format:check`   | Check formatting without writing (used by CI)                                        |
| `npm run check:contrast` | WCAG contrast of the key design-token pairs in both themes (used by CI)              |
| `npm run check:colors`   | Fail on raw hex/`rgb()`/`hsl()` colors in `src/` outside the token file (used by CI) |
| `npm run i18n:check`     | Missing keys, empty values and ICU errors in `messages/*.json` (used by CI)          |
| `npm test`               | Unit and component tests (Vitest + Testing Library, jsdom)                           |
| `npm run test:watch`     | Unit tests in watch mode                                                             |
| `npm run test:coverage`  | Unit tests with a coverage report in `coverage/`                                     |
| `npm run test:db`        | Database/RLS tests against local Supabase (run `db:start` first)                     |
| `npm run e2e`            | Playwright e2e tests (desktop Chromium + WebKit iPhone 14)                           |
| `npm run e2e:ui`         | Playwright UI mode                                                                   |
| `npm run db:start`       | Start local Supabase (Docker); prints the local URLs and keys                        |
| `npm run db:stop`        | Stop local Supabase (data is kept in Docker volumes)                                 |
| `npm run db:status`      | Print the local URLs and keys again                                                  |
| `npm run db:reset`       | Drop and rebuild the local DB from migrations + `seed.sql`                           |
| `npm run db:new <name>`  | Create an empty migration `supabase/migrations/<timestamp>_<name>.sql`               |
| `npm run db:types`       | Regenerate `src/types/database.ts` from the local DB                                 |

Before opening a PR run `npm run lint && npm run typecheck && npm run format:check && npm run check:contrast && npm run check:colors && npm run i18n:check && npm test && npm run build` (plus `npm run test:db` and `npm run e2e` when you touched the database or a user flow).

## CI

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every pull request and on pushes to `main`: lint/typecheck/format (plus the design-token and translations checks), unit tests, database tests on a fresh Supabase with all migrations plus a check that `src/types/database.ts` is up to date, the production build, the Docker image (built and health-checked, not pushed), and Playwright e2e (report and traces uploaded on failure). Branch protection (a one-time manual setup) makes the **CI passed** check and one approval required to merge into `main`. See [docs/ci.md](docs/ci.md) for the jobs, how to read failures, optional secrets and the branch protection setup.

## Docker

Production runs the app as a Docker container on self-hosted Coolify ([architecture → Deployment](docs/architecture.md#deployment-self-hosted-coolify)). The [`Dockerfile`](Dockerfile) is multi-stage (deps → build → runtime) on Node 22 Alpine and uses Next.js `output: 'standalone'`, so the final image (~75 MB compressed, ~210 MB unpacked) contains only `server.js`, the traced `node_modules` (including `sharp` for image optimization) and static assets. It runs as the non-root user `nextjs` (uid 1001) on port 3000.

```bash
npm run docker:build   # docker build -t gym-tracker with NEXT_PUBLIC_* from .env.local as build args
npm run docker:run     # docker run --rm --env-file .env.local -p 3000:3000 gym-tracker
curl http://localhost:3000/api/health   # {"status":"ok","version":"<commit sha>"}
```

- **Build arguments (public, inlined into the browser bundle):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, plus `APP_VERSION` (the commit SHA reported by `/api/health` and used as the Sentry release; defaults to the `package.json` version) and the optional Sentry settings `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, `SENTRY_ORG`, `SENTRY_PROJECT` ([Error tracking](#error-tracking-sentry)). `docker:build` reads the `NEXT_PUBLIC_*`, `SENTRY_ORG` and `SENTRY_PROJECT` lines of `.env.local` (or your shell env), passes `SENTRY_AUTH_TOKEN` from your shell as a BuildKit secret if set, and passes extra arguments through to `docker build`.
- **Build secret:** `SENTRY_AUTH_TOKEN` (source-map upload) only via `--secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN`; it isn't stored in the image or its history. The build step also accepts every build argument above as an optional BuildKit secret with the variable's name (`--secret id=NEXT_PUBLIC_SUPABASE_URL,env=…`, `id=SENTRY_AUTH_TOKEN`, …), which is how Coolify passes them with build secrets on ([docs/deployment.md → Variables](docs/deployment.md#6-variables)).
- **Runtime only (secrets):** `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (optional, not secret: `SENTRY_DSN`, `ENABLE_TEST_ERROR_PAGE`, `ENABLE_DEV_PAGES`). Pass them with `--env-file`/`-e` when the container starts; never as `--build-arg` (build arguments are visible in `docker history`).
- **Health check:** `GET /api/health` returns `200 {"status":"ok","version":…}` without auth or database access. The image's `HEALTHCHECK` calls it; `docker inspect --format '{{.State.Health.Status}}' <container>` shows `healthy` within a few seconds.
- **Local Supabase from the container:** `127.0.0.1` inside the container is the container itself. To use the local stack, build and run with `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321` (on Linux also add `--add-host=host.docker.internal:host-gateway` to `docker run`).

CI builds the image on every PR (no push) and checks that the container becomes healthy (see [docs/ci.md](docs/ci.md)).

## Deployment

Coolify builds this Dockerfile on our server. Every pull request into `main` gets a preview at `https://pr-<n>.<staging-domain>` (Supabase staging, Clerk dev), removed when the PR closes. After CI passes on `main`, [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `supabase db push` against staging, then production, then deploys that exact commit to Coolify through its API and waits until `/api/health` reports it; a failed migration stops the deploy. Until the one-time setup is done (repository variable `DEPLOY_ENABLED=true`), the workflow skips with a notice. The runbook — setup checklist, variables per environment, rollback, manual migrations, secret rotation, troubleshooting — is [docs/deployment.md](docs/deployment.md).

## Database (Supabase)

The schema lives in [`supabase/migrations`](supabase/migrations) and is the only way to change it (see [architecture conventions](docs/architecture.md#conventions)). Local development runs the full Supabase stack in Docker through the [Supabase CLI](https://supabase.com/docs/guides/local-development), installed as a dev dependency (`npx supabase …` works too).

**Start and connect**

```bash
npm run db:start    # API http://127.0.0.1:54321 · Postgres :54322 · Studio http://127.0.0.1:54323
npm run db:status   # show the URLs and keys again
```

Copy `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY` from the output into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. The local keys and `JWT_SECRET` are the CLI's fixed development defaults, not real secrets. Studio (`http://127.0.0.1:54323`) gives you a table editor and SQL console; `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres` works too.

**Change the schema**

```bash
npm run db:new add_profiles   # creates supabase/migrations/<timestamp>_add_profiles.sql
# write the SQL, then:
npm run db:reset              # rebuild the DB from all migrations + supabase/seed.sql
npm run db:types              # regenerate src/types/database.ts
```

Commit the migration and the regenerated `src/types/database.ts` in the same PR. `db:types` is deterministic: running it on an unchanged schema produces no diff, and CI fails the PR if the committed file is out of date. Never edit a migration that has already been merged; add a new one.

**`uid()`** (E04-T02) returns the request's Clerk user id (`auth.jwt()->>'sub'`, `text`), `null` when signed out. Every RLS policy uses it as `(select uid())`, e.g. `using (owner_id = (select uid()))`.

**Search helpers.** The first migration enables `pg_trgm` and `unaccent` (in the `extensions` schema) and adds `public.f_unaccent(text)`, an `immutable` wrapper you can use in generated columns and indexes, e.g. `lower(f_unaccent(trim(name)))`; `select f_unaccent('Ąžuolas')` returns `Azuolas`. Trigram indexes use `extensions.gin_trgm_ops`.

**Troubleshooting.** If ports 54320–54329 are taken, stop the other stack (`npx supabase stop --project-id <id>`) or change the ports in `supabase/config.toml`. `npm run db:stop -- --no-backup` also deletes the local data volumes.

## Supabase clients

Never call `createClient` from `@supabase/supabase-js` directly; use the helpers in [`src/lib/supabase`](src/lib/supabase) (the browser hook wraps `createBrowserClient()` from `@/lib/supabase/client`). All three are typed with the generated `Database` (`src/types/database.ts`), so table and column names are checked by `npm run typecheck`.

| Helper                       | Import                                                 | Use in                                                  | Key / RLS                                                    |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| `createServerClient()`       | `@/lib/supabase/server`                                | Server Components, Server Actions, Route Handlers       | anon key + user's token, RLS applies; new client per request |
| `useSupabaseBrowserClient()` | `@/components/common/auth/use-supabase-browser-client` | Client components (TanStack Query live views, Realtime) | anon key + user's token, RLS applies; singleton per tab      |
| `createAdminClient()`        | `@/lib/supabase/admin`                                 | Clerk webhook and admin jobs only                       | **service-role key, bypasses RLS**; server only              |

```ts
import { createServerClient } from "@/lib/supabase/server";

const supabase = createServerClient();
const { data, error } = await supabase.from("sample_notes").select("id, body");
```

- **User token (E04-T02).** Clerk is a Supabase third-party auth provider: requests carry the user's Clerk session token, Supabase checks it against the Clerk instance's keys, and RLS reads the Clerk user id with `uid()` ([data-model.md](docs/data-model.md)). `createServerClient()` gets the token from `(await auth()).getToken()` itself. In client components use `useSupabaseBrowserClient()` (`@/components/common/auth/use-supabase-browser-client`), which passes `useAccount()?.getToken` (Clerk's `session.getToken()`) to the tab's one `createBrowserClient()`. Signed out, while Clerk loads and without Clerk keys there is no token: requests use the anon key and RLS only lets through what `anon` may see (no user data), so start queries that need the user once `useAccount()` is set. `{ accessToken }` (`() => Promise<string | null>`) overrides the token, e.g. the DB tests' signed JWTs. Never use `auth.uid()` in SQL: it casts `sub` to uuid and fails on Clerk ids.
- **Server only.** `server.ts` and `admin.ts` start with `import "server-only"`: importing them from a `"use client"` module fails `next build`. The service-role key has no `NEXT_PUBLIC_` prefix, so it is never inlined into the browser bundle.
- **Env vars** are read when a client is created, not at import, so `npm run build` works without them; a missing variable throws an error naming it.

## Server Actions and errors

Every mutation is a Server Action wrapped in `withAction()` ([`src/lib/actions/with-action.ts`](src/lib/actions/with-action.ts)) and returns a [`Result<T>`](src/lib/result.ts): `{ ok: true, data }` or `{ ok: false, error: ErrorCode, fields? }`. The UI never shows raw messages; it translates `errorMessageKey[error]` (`errors.*` keys, [`src/lib/errors.ts`](src/lib/errors.ts), translated with next-intl).

```ts
"use server";
import { z } from "zod";

import { withAction } from "@/lib/actions/with-action";
import { createServerClient } from "@/lib/supabase/server";

export const renameSession = withAction(
  z.object({ id: z.uuid(), name: z.string().trim().min(1).max(100) }),
  async ({ id, name }) => {
    const { data, error } = await createServerClient()
      .from("sessions")
      .update({ name })
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw error; // PGRST116 → NOT_FOUND, 42501 → FORBIDDEN, 23505 → CONFLICT
    // Expected failures: throw new AppError("LOCKED") (from "@/lib/errors").
    return data;
  },
);
// → { ok: true, data } | { ok: false, error: "VALIDATION", fields: { name: "VALIDATION" } } | …
```

| Error code                             | When                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `VALIDATION`                           | the zod schema rejected the input; `fields` maps each invalid path (`"sets.0.reps"`) to a code        |
| `UNAUTHORIZED`, `LOCKED`, …            | the handler threw `new AppError(code)` (expected, **not** reported)                                   |
| `FORBIDDEN` / `NOT_FOUND` / `CONFLICT` | the handler threw a Supabase `PostgrestError` `42501` / `PGRST116` / `23505` (expected, not reported) |
| `UNKNOWN`                              | anything else: reported to Sentry, message never sent to the client                                   |

`redirect()`, `notFound()` and other Next.js control-flow errors pass through untouched. Example and tests: [`src/lib/actions/example-action.ts`](src/lib/actions/example-action.ts).

## Error tracking (Sentry)

[`@sentry/nextjs`](https://docs.sentry.io/platforms/javascript/guides/nextjs/) reports errors from the browser ([`src/instrumentation-client.ts`](src/instrumentation-client.ts), [`src/app/global-error.tsx`](src/app/global-error.tsx)), the Node.js server and the edge runtime ([`src/instrumentation.ts`](src/instrumentation.ts): `onRequestError` catches Server Component, route handler and Server Action errors). It is **off unless a DSN is set**, so local dev, CI and builds need no Sentry account.

| Variable                         | When            | Where                                                                           | Purpose                                                                                                                                                                                     |
| -------------------------------- | --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`         | build           | Docker build arg / Coolify build variable                                       | Enables Sentry in the browser (and on the server unless `SENTRY_DSN` is set). Public by design.                                                                                             |
| `SENTRY_DSN`                     | runtime         | container env                                                                   | Optional server-side DSN override.                                                                                                                                                          |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | build           | build arg                                                                       | `production` / `preview`; defaults to `NODE_ENV`.                                                                                                                                           |
| `APP_VERSION`                    | build + runtime | build arg                                                                       | The **release** (commit SHA); `/api/health` reports the same value.                                                                                                                         |
| `SENTRY_ORG`, `SENTRY_PROJECT`   | build           | build arg                                                                       | Where source maps are uploaded.                                                                                                                                                             |
| `SENTRY_AUTH_TOKEN`              | build           | **secret** (`docker build --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN`) | Uploads source maps (then deletes them from the build, so they're never served). Without it nothing is uploaded. Never a build arg.                                                         |
| `ENABLE_TEST_ERROR_PAGE`         | runtime         | container env                                                                   | `1` enables `/debug/error` (404 otherwise): `?throw=server` throws in a Server Component, the button throws in a client component. Use it to check a deployment's events, then turn it off. |

**Privacy.** Events carry no emails, tokens or cookies: `dataCollection` turns off user info, cookies, bodies, query strings, SQL values and local variables, and `beforeSend` ([`src/lib/sentry/scrub.ts`](src/lib/sentry/scrub.ts)) replaces emails with `[email]`, JWTs with `[jwt]`, drops `Authorization`/`Cookie`/`*token*`/`*secret*`/`*password*` fields and keeps only the user's id. Tracing and session replay are off.

**Try it locally** without Sentry: `tests/e2e/error-tracking.spec.ts` starts a fake ingest server and checks both errors arrive with the release and no email:

```bash
NEXT_PUBLIC_SENTRY_DSN=http://public@127.0.0.1:8999/1 ENABLE_TEST_ERROR_PAGE=1 APP_VERSION=local-test \
  CI=1 npm run e2e -- --project chromium-desktop tests/e2e/error-tracking.spec.ts
```

## Authentication (Clerk)

Sign-in is [Clerk](https://clerk.com) with **Google only** (E04-T01; dashboard setup in [docs/deployment.md → Clerk](docs/deployment.md#4-clerk)). Locally, put the dev instance's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` (Clerk dashboard → _API keys_) in `.env.local`.

- **Routes.** `/{locale}/sign-in` is Clerk's `<SignIn />` (one sign-in-or-up flow: the first Google sign-in creates the account). The Proxy (`src/proxy.ts`) runs `clerkMiddleware` around the locale routing; signed out, every page of `src/app/[locale]/(app)/` redirects to `/{locale}/sign-in?redirect_url=<page>` and comes back there after sign-in (otherwise Home), and every API route except `/api/health` and `/api/webhooks/*` answers 404. The rules are `isProtectedPath()` in `src/lib/auth/auth-routes.ts`; a new `(app)` folder is protected automatically (a unit test checks the folders). Sign out (avatar menu) returns to the landing page.
- **Server code:** `auth()` / `currentUser()` from `@clerk/nextjs/server`. **Components:** `useAccount()` (`src/components/common/auth/account-context.ts`: name, email, photo, `signOut(url)`; `null` while loading or signed out) instead of Clerk's hooks, so they also render where Clerk isn't loaded.
- **Language and theme.** `<ClerkProvider>` (`AuthProvider`, in `app/[locale]/layout.tsx`) gets the URL's locale — Clerk has no Lithuanian, so our own strings for the sign-in flow are in `src/lib/auth/clerk-localizations.ts` (not in `messages/*.json`: Clerk uses `{{placeholder}}`, not ICU) — and `appearance` variables that point at the design tokens (`src/lib/auth/clerk-appearance.ts`), so the card follows light / dark.
- **Supabase (E04-T02).** The app sends the Clerk session token to Supabase ([Supabase clients](#supabase-clients)). For the local stack to accept it, enable Clerk there: add `SUPABASE_AUTH_THIRD_PARTY_CLERK_ENABLED=true` and `CLERK_FRONTEND_API_DOMAIN=<your dev instance>.clerk.accounts.dev` (Clerk dashboard → _API keys_ → Frontend API URL, without `https://`) to `.env.local` — the Supabase CLI reads it too — and restart it (`npm run db:stop && npm run db:start`); `supabase start` then needs to reach that domain. Also activate the Supabase integration in the Clerk dev instance ([docs/deployment.md → Clerk](docs/deployment.md#4-clerk)), or tokens lack `role: authenticated` and RLS treats you as `anon`. Without these the local stack rejects real Clerk tokens (401); the DB tests don't need them.
- **Without keys** (`isClerkConfigured()`, `src/lib/auth/clerk-env.ts`) the build and the public pages work and protected pages still redirect to sign-in, which then says sign-in isn't available. That is how CI's build, Docker and (without the secrets) e2e jobs run. Sign-in URLs are set in code per locale; don't set `NEXT_PUBLIC_CLERK_SIGN_IN_URL`.

## Tests

Unit/component tests (Vitest + React Testing Library) live next to the code as `*.test.ts(x)`; database/RLS tests in `tests/db` act as fake users with signed JWTs against local Supabase; e2e tests in `tests/e2e` run in Playwright on desktop Chromium and mobile WebKit. First time: `npx playwright install chromium webkit`.

```bash
npm test                         # unit + component
npm run db:start && npm run test:db   # RLS tests (local Supabase only)
npm run e2e                      # starts the dev server itself
```

See [tests/README.md](tests/README.md) for the approach, how the database is reset between tests, factories, and signing in with Clerk in e2e tests.

## Design tokens and dev pages

Colors, type, radii and spacing are design tokens defined once in [`src/app/globals.css`](src/app/globals.css) and used through Tailwind utilities: `bg-background`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `bg-primary text-primary-foreground`, `border-input`, `ring-ring`, `bg-chart-1`…`bg-chart-5`, `rounded-lg` (controls), `rounded-2xl` (cards). Tailwind's default palette is removed, and `npm run check:colors` (CI) fails on raw colors anywhere else in `src/`; a line that really needs one can opt out with a `raw-color-allowed: <reason>` comment. `npm run check:contrast` (CI) checks the key pairs against WCAG AA in both themes. The Inter font is downloaded from Google Fonts by `next build` and self-hosted, so builds (CI, Docker, Coolify) need access to `fonts.googleapis.com`/`fonts.gstatic.com`; browsers never contact Google. Values, decisions and how to add a token: [docs/design-system.md](docs/design-system.md#final-token-values-e02-t01).

**Themes.** Light, dark and system (the default, follows the OS live) via [next-themes](https://github.com/pacocoursey/next-themes); the choice is kept in local storage (`theme`). `<ThemeToggle />` (`@/components/common/theme/theme-toggle`) is the switch; details, the theme-color meta and the hook for saving the choice to `profiles.theme` are in [docs/design-system.md → Themes](docs/design-system.md#themes-light--dark--system-e02-t02).

**Components.** The base UI components (Button, Input, FormField, Card, Dialog, Sheet, Popover, Tabs, SegmentedControl, Toast, Avatar, Chip, Skeleton, DropdownMenu, EmptyState, …) live in [`src/components/ui/`](src/components/ui/), built on [Radix](https://www.radix-ui.com/) the way [shadcn/ui](https://ui.shadcn.com/) does it and styled with the tokens only. Import them from `@/components/ui/<name>`; merge classes with `cn()` from `@/lib/utils/cn`. Toasts: `showToast("Set saved")` (the `<Toaster />` is in the root layout). API and decisions: [docs/design-system.md → Core components](docs/design-system.md#core-components).

**App layout.** The signed-in area lives under `src/app/[locale]/(app)/` (`/lt/dashboard` = Home, `/sessions`, `/progress`, `/buddies`, `/settings`; `lt` or `en`). Its layout renders `AppShell` (bottom navigation below 1024 px, sidebar from 1024 px); each page starts with `<PageHeader title="…" backHref="…" />` (title, back button on detail pages, avatar menu with the user, language, theme, settings and sign out), and each section has a `loading.tsx` (`<PageSkeleton />`) and an `error.tsx` (`<SectionError />`, reported to Sentry). Details: [docs/design-system.md → Layout](docs/design-system.md#layout). Every page there needs sign-in ([Authentication](#authentication-clerk)).

**Translations.** UI text is in `messages/en.json` and `messages/lt.json` (namespaces `common`, `nav`, `errors`, `auth`, `landing` and one per feature), read with [next-intl](https://next-intl.dev) (E03-T01): `const t = await getTranslations("nav")` (`next-intl/server`) in async Server Components and `generateMetadata`, `const t = useTranslations("nav")` / `useLocale()` (`next-intl`) in client and non-async components; neither needs the locale passed in. Every page lives under `src/app/[locale]/` (`/lt/…`, `/en/…`). The Proxy [`src/proxy.ts`](src/proxy.ts) (Next.js 16's name for middleware) redirects any other path to a locale: the URL's locale wins, then the `NEXT_LOCALE` cookie (kept for a year; the proxy refreshes it when the URL's locale differs), then the browser's `Accept-Language`, then `lt` — so `/` → `/lt` for a Lithuanian or German browser and `/en` for an English one. `src/app/[locale]/layout.tsx` is the root layout: `<html lang>`, the localized title template and meta description, and `NextIntlClientProvider`; the locale reaches next-intl through the `[locale]` root param (`src/lib/i18n/request.ts`), so pages stay statically rendered. Keys are type-checked against `en.json` (`src/global.d.ts`), so an unknown key fails `npm run typecheck`; `lt.json` must have the same keys (typecheck, and `npm run i18n:check` in CI; see **Adding a string** below). Use `’`, not `'`, in messages (ICU quoting). The developer pages `/dev` and `/debug` are not localized (English root layout in `src/app/(developer-tools)/`, skipped by the proxy). **Switching language** (E03-T02): the avatar menu's Language items and the `LanguageSwitcher` on the landing page (both through `useLocaleSwitch()`, `src/components/common/language/`) open the same path and query in the other locale (`/lt/sessions?tab=x` → `/en/sessions?tab=x`) and write the `NEXT_LOCALE` cookie in the browser, so `/` opens in that language next time. Navigate between localized pages with next-intl's `usePathname()` / `useRouter()` from `src/lib/i18n/navigation.ts` when the locale must change; plain `next/link` with `getAppPath(locale, …)` is fine otherwise. Saving the language to `profiles.locale` (follows the user to other devices) comes with E04-T04.

**Adding a string** (checked by `npm run i18n:check`, E03-T04):

1. Add the key to **both** `messages/en.json` and `messages/lt.json`, in the namespace of the feature (`sessions`, `buddies`, …; `common` for text shared across features), with the same key path in both. Never leave a value empty: if you can't translate it yet, ask in the PR rather than committing a placeholder.
2. Write ICU messages: arguments in braces (`"Remove {item}"`), counts as plurals with `#` for the number. English needs `one` and `other`; Lithuanian needs `one`, `few`, `many` and `other` (`"{count, plural, one {# serija} few {# serijos} many {# serijos} other {# serijų}}"`). Use the same argument names in both files, and `’` instead of `'`.
3. Use it with `t("key")` from `useTranslations("namespace")` / `getTranslations("namespace")`; a key that isn't in `en.json` fails `npm run typecheck`.
4. Run `npm run i18n:check`. It reads every `messages/*.json` (`en.json` is the reference) and lists every problem with its file and key path, e.g. `messages/lt.json: missing key "counts.weeks"`, `messages/lt.json: empty value for "common.back"`, `invalid ICU syntax in "counts.reps": EXPECT_ARGUMENT_CLOSING_BRACE …`, a plural missing a category the locale needs, or `"ui.remove" uses the arguments {name} but messages/en.json uses {item}`. It exits 1 on any problem (CI's **Lint, typecheck, format** job runs it; [docs/ci.md](docs/ci.md#translations-check)). The checks live in `scripts/i18n/`; `src/lib/i18n/messages.test.ts` runs the same ones in `npm test`.

**Formatting and plurals** (E03-T03). Never format numbers, dates or durations by hand: use the presets from `useFormat()` (client components, `src/lib/i18n/format/use-format.ts`) or `await getFormat()` (Server Components and Server Actions, `get-format.ts`): `weight(57.5)` → "57,5 kg" / "57.5 kg", `date(d)` → "2026 m. lapkričio 17 d." / "November 17, 2026", `dateTime(d)` → "2026 m. lapkričio 17 d. 07:30" / "November 17, 2026 at 07:30" (24-hour, as on the mock-ups), `relative(d)` → "prieš 2 dienas" / "2 days ago", `duration(75)` → "1 val. 15 min." / "1 h 15 min". Counts are ICU plurals in the `counts` namespace (`sets`, `reps`, `sessions`, `exercises`, `buddies`): `t("sets", { count })` → "1 serija", "2 serijos", "10 serijų", "21 serija", "1,5 serijos" / "1 set", "2 sets"; Lithuanian needs `one`, `few`, `many` (decimals) and `other` (0, 10–20, 30…) — write all four. **Time zone:** times are shown in the browser's time zone. The browser writes it to the `TIME_ZONE` cookie (`TimeZoneCookieWriter` in the root document); `getFormat()` reads it (falling back to `Europe/Vilnius` when it's missing or invalid), which makes that route dynamic, so it's for pages rendered per request anyway (the signed-in area). Static pages and the request config stay on `Europe/Vilnius`, and `useFormat()` renders the server's zone during hydration and the browser's right after, so there is no hydration mismatch (at most a one-time change on the very first visit). A dynamic layout can pass `await getRequestTimeZone()` to a nested `NextIntlClientProvider timeZone` so client components get the user's zone on the server too (see `/dev/format`); a layout whose client components show `relative()` times also passes `now={new Date()}` there, so the server render and hydration count from the same moment (next-intl's `useNow()`; static pages can't, so they don't server-render relative times).

Developer-only pages live under `/dev` (`src/app/(developer-tools)/dev/`, English only): `/dev/tokens` shows every token and `/dev/ui` every component and variant, both with the theme toggle to switch between light and dark. `/dev/format` (E03-T03) shows every formatting preset rendered on the server and in a client component, in both languages. They are served by `next dev` and are a 404 in production builds unless the runtime variable `ENABLE_DEV_PAGES=1` is set (e.g. briefly on a preview deployment for a design review; the gate is `src/app/(developer-tools)/dev/layout.tsx`).

## Project structure

Code lives in `src/` and follows [docs/architecture.md → Code structure](docs/architecture.md#code-structure). Import from `src/` with the `@/` alias, e.g. `import { x } from "@/lib/utils/x"`.
