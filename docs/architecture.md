# Architecture

## Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js** (App Router, TypeScript, React Server Components) | Server Actions for mutations, Route Handlers only where needed |
| Auth | **Clerk** with Google OAuth | Only Google is enabled as a sign-in method |
| Database / storage | **Supabase** (Postgres, RLS, Realtime) | Clerk set up as a Supabase third-party auth provider |
| Styling | **Tailwind CSS** + CSS variables (design tokens) | See [design-system.md](design-system.md) |
| UI primitives | **shadcn/ui** (Radix based) | `Command` + `Popover` for the autocomplete combobox |
| Theming | **next-themes** | `light` / `dark` / `system` |
| i18n | **next-intl** | Locales `en`, `lt`; messages in `/messages/{locale}.json` |
| Forms / validation | **react-hook-form** + **zod** | Zod schemas shared between client and server actions |
| Charts | **Recharts** | Themed with design tokens |
| Data fetching (client) | **TanStack Query** | Only for interactive client views (session logging) |
| Testing | **Vitest** + Testing Library (unit), Vitest + signed JWTs against local Supabase (RLS), **Playwright** + `@clerk/testing` (e2e) | See [tests/README.md](../tests/README.md) |
| Lint / format | ESLint, Prettier, TypeScript strict | |
| CI | GitHub Actions | lint, typecheck, unit, e2e, DB migration check |
| Hosting (app) | **Self-hosted Coolify** (Docker, Next.js `output: 'standalone'`) | Preview deployment per PR via Coolify; TLS via Coolify's proxy |
| Hosting (DB) | **Supabase Cloud** | Staging + production projects |
| Auth provider | **Clerk Cloud** | Dev instance (local + previews) and production instance |

## System overview

```
┌────────────┐   Google OAuth   ┌────────┐
│  Browser   │ ───────────────▶ │ Clerk  │
│ (Next.js   │ ◀─── session ─── │        │
│  client)   │                  └────────┘
└─────┬──────┘                       │ session token (JWT, sub = Clerk user id)
      │ RSC / Server Actions         ▼
┌─────▼──────────────────┐   ┌──────────────────────┐
│ Next.js server         │──▶│ Supabase Cloud       │
│ (Docker on Coolify)    │   │ - RLS on every table │
│ - Proxy: next-intl +   │
│   Clerk middleware     │   │                      │
│ - Supabase client with │   │ - auth.jwt()->>'sub' │
│   Clerk token          │   │ - Realtime channels  │
└────────────────────────┘   └──────────────────────┘
        ▲
        │ Clerk webhook (user.created / user.updated / user.deleted)
        └── /api/webhooks/clerk → upserts `profiles`
```

## Authentication & authorization

1. User signs in with Google through Clerk (`<SignIn withSignUp />` on `/{locale}/sign-in`, Google is the only method enabled in the Clerk dashboard; the first sign-in creates the account).
2. Clerk middleware protects the signed-in area — every section of `app/[locale]/(app)/` (`/{locale}/dashboard`, `/sessions`, …) — and every API route except the webhooks (`/api/webhooks/*`) and the health check (`/api/health`); the landing page `/{locale}`, sign-in and the 404 page are public (`isProtectedPath()` in `src/lib/auth/auth-routes.ts`). Signed-out page requests go to `/{locale}/sign-in?redirect_url=…` and return there after sign-in; API routes answer 404. It runs in the app's one Proxy, `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`): `clerkMiddleware` around next-intl's locale routing (E03-T01, E04-T01). Without Clerk keys (CI) the proxy refuses the same requests the same way, without Clerk. `<ClerkProvider>` (`components/common/auth/auth-provider.tsx`) follows the URL's locale and the design tokens.
3. Supabase is configured with **Clerk as a third-party auth provider** (E04-T02: local `supabase/config.toml` `[auth.third_party.clerk]`, opt-in via env; staging and production in the Supabase dashboard), and the Clerk instances have the Supabase integration activated, which adds `role: authenticated` to the session token. Supabase verifies the token with the Clerk instance's public keys (JWKS); a forged, expired or other-issuer token gets 401. The Supabase clients pass the Clerk session token as `accessToken`: on the server `createServerClient()` uses `(await auth()).getToken()`; in the browser `useSupabaseBrowserClient()` passes `useAccount()?.getToken` (Clerk's `session.getToken()`) to the tab's one client. No token (signed out, Clerk loading, no Clerk keys) = the `anon` role, which no policy lets read user data (fail closed).
4. RLS policies use `uid()` (`public.uid()`, `auth.jwt()->>'sub'`, `stable`: the Clerk user id, `text`) as `(select uid())` to identify the user. Supabase's `auth.uid()` casts to uuid and must not be used.
5. A Clerk webhook (verified with Svix signature) keeps the `profiles` table in sync (name, email, avatar). On first login the app also upserts the profile as a fallback in case the webhook is late.
6. The service-role key is used **only** in the webhook handler, never in user-facing code paths.

## Code structure

```
src/
  app/
    [locale]/              lt | en; root layout (<html lang>, NextIntlClientProvider,
                           localized metadata); not-found.tsx + [...unknownPath]/
                           = localized 404
      (public)/            landing; sign-in/[[...signIn]] (Clerk <SignIn />, E04-T01)
      (app)/               authenticated area; layout.tsx = AppShell (E02-T06),
                           each section has page / loading / error
        dashboard/         Home
        buddies/
        sessions/
          [sessionId]/
        exercises/
        progress/
          exercise/[exerciseId]/
          session/[sessionId]/
        settings/
    (developer-tools)/     English-only root layout for dev/ (design previews)
                           and debug/ (error-tracking smoke test)
    root-document.tsx      <html>/<body>, font, ThemeProvider shared by both root layouts
    api/webhooks/clerk/route.ts
    api/health/route.ts    public liveness check (Docker HEALTHCHECK, Coolify)
  components/
    ui/                    shadcn primitives (themed)
    common/                app-level shared components (auth/: AuthProvider = ClerkProvider,
                           useAccount(), useSupabaseBrowserClient(); app-shell/, page/,
                           language/, theme/)
  features/
    buddies/  sessions/  exercises/  logging/  progress/
      components/  actions.ts  queries.ts  schemas.ts
  lib/
    auth/   (protected routes, Clerk env check, Clerk localization + appearance; E04-T01)
    supabase/ (server.ts, client.ts, admin.ts — service role, webhook/admin jobs only)
    i18n/   (locales, next-intl routing + request config + navigation, messages, time zone, format/ presets)
    tags/   (auto-tag rules)
    utils/
  proxy.ts                 Clerk (route protection) around next-intl locale routing
  global.d.ts              next-intl AppConfig: typed locales, message keys and named formats
  types/database.ts        generated by `supabase gen types`
messages/en.json, lt.json  UI text per namespace (next-intl, E03); `npm run i18n:check` keeps them in sync
supabase/migrations/       SQL migrations (source of truth for schema)
supabase/seed.sql          tags, common machines, sample exercises
```

Each feature folder owns its server actions (mutations), queries (reads) and zod schemas.

## Conventions

- **Mutations** go through Server Actions wrapped in `withAction()` (`src/lib/actions/with-action.ts`), which validates the input with zod and returns a typed `Result<T>` (`src/lib/result.ts`): `{ ok: true, data }` or `{ ok: false, error: ErrorCode, fields? }`. Error codes (`src/lib/errors.ts`: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT`, `LOCKED`, `UNKNOWN`) map to translated `errors.*` messages. Expected failures (`AppError`, known Postgres codes) are returned, not reported; anything else becomes `UNKNOWN` and is reported to error tracking.
- **Reads** happen in Server Components where possible; client components use TanStack Query only for live views.
- **Database schema** changes only via `supabase/migrations`; types regenerated in the same PR.
- **No hard-coded UI strings.** All text goes through `next-intl`; CI fails on missing keys.
- **No hard-coded colors.** Use design tokens only.
- **Dates** stored as `timestamptz` (UTC), displayed in the user's locale/timezone. Format weights, dates, relative times and durations only with `useFormat()` (client) / `getFormat()` (server) from `src/lib/i18n/format/` (E03-T03), and counts with the ICU plurals in `messages/*.json` (`counts.*`), never by hand. The browser writes its time zone to the `TIME_ZONE` cookie; pages stay statically rendered in `Europe/Vilnius` and client components switch to the browser's zone after hydration, while dynamic (signed-in) pages read the cookie (`getFormat()`, `getRequestTimeZone()`), so server and client agree.
- **Accessibility**: WCAG 2.1 AA; every interactive element is keyboard reachable and labeled.

## Realtime

The session logging screen subscribes to Supabase Realtime (Postgres changes on `session_sets`, `session_exercises`, `session_exercise_notes`, filtered by `session_id`) so participants logging on different phones see each other's entries. RLS applies to realtime too.

## Environments

| Env | App | DB | Clerk |
|---|---|---|---|
| Local | `next dev` | Supabase CLI (Docker) | Clerk dev instance |
| Preview | Coolify preview deployment per PR (`pr-{n}.<staging-domain>`) | Supabase staging project | Clerk dev instance |
| Production | Coolify production app (custom domain) | Supabase production project | Clerk production instance |

Secrets: set per environment in Coolify (runtime and build-time variables; build-time values passed as BuildKit secrets) and in GitHub Actions environments `staging` / `production` (migration and deploy credentials only: Supabase access token, project ref, DB password; Coolify URL, API token, app UUID). App variables: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only). Documented in `.env.example`.

## Deployment (self-hosted Coolify)

- The app is built from a multi-stage `Dockerfile` using Next.js `output: 'standalone'` (Node 22 Alpine pinned by digest, `sharp` for image optimization, runs as non-root user `nextjs`, listens on port 3000). The commit SHA is passed as the `APP_VERSION` build argument and reported by `GET /api/health` (public, no DB), which the image's `HEALTHCHECK` and Coolify probe. See README → Docker.
- `NEXT_PUBLIC_*` variables are inlined at build time, so they're set as **build variables** in Coolify for each environment; server secrets are **runtime variables**. Coolify's *Docker BuildKit secrets* mode passes build variables as secrets (so `SENTRY_AUTH_TOKEN` never lands in the image); the Dockerfile accepts both secrets and build args. Variable table per environment: [deployment.md → Variables](deployment.md#6-variables).
- Coolify is connected to the GitHub repo through its GitHub App. Automatic deploys on push are **off** for production: after CI passes on `main`, `.github/workflows/deploy.yml` applies Supabase migrations to staging, then production (`supabase db push`), then pins the Coolify app to that commit and triggers the deploy through the Coolify API, and waits until `/api/health` reports the commit. A failed migration stops the deploy. Runbook (setup, rollback, manual migrations, secret rotation): [deployment.md](deployment.md).
- Migrations are forward-only and must be backward-compatible with the running version (expand/contract), because rollbacks only change the container and old/new containers overlap during a rolling update.
- Pull requests into `main` get Coolify **preview deployments** (`pr-{n}.<staging-domain>`), wired to the Supabase staging project and the Clerk dev instance, deleted when the PR closes. Stacked PRs (base ≠ `main`) get no preview.
- Coolify's proxy (Traefik) handles HTTPS certificates (Let's Encrypt) and routing.
- The server should be in the same region as the Supabase project (e.g. EU Central) to keep database latency low.
- The Next.js cache lives in the container filesystem; it's fine with one instance. Running more than one instance later needs a shared cache handler.
- Clerk webhooks need a public URL: production → production domain; the Clerk dev instance → the staging/preview URL.

## Non-functional requirements

| Area | Target |
|---|---|
| Performance | LCP < 2.5 s on mid-range phone (4G); set logging round-trip < 300 ms p95 |
| Availability | App runs on a single self-hosted Coolify server; the app container is stateless, so recovery = redeploy the last good image. Supabase and Clerk rely on their cloud SLAs. Health check at `/api/health` |
| Security | RLS on 100% of tables; RLS tests in CI; no service key in client bundle |
| Privacy | Users see only their own data, buddies' public profile, and shared session data. Account deletion removes personal data (GDPR) |
| Accessibility | WCAG 2.1 AA, contrast checked in both themes |
| Browser support | Last 2 versions of Chrome, Safari (iOS), Firefox, Edge |
| Observability | Error tracking with Sentry (`@sentry/nextjs`; browser, Node and edge; release = commit SHA, same as `/api/health`; source maps uploaded at build time; PII scrubbed in `beforeSend`; see README → Error tracking), privacy-friendly analytics (e.g. Plausible or Umami, can also run on Coolify), uptime monitoring of `/api/health`, container logs in Coolify |
