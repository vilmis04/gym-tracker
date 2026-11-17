# E01 · Project Foundation

**Goal:** A working, deployable Next.js + Supabase skeleton with tooling and CI so every later epic can ship small PRs safely.
**Milestone:** M1 · Walking skeleton
**Depends on:** —

---

### E01-T01 · Bootstrap Next.js app — `S`
**Why:** Every other task needs a consistent codebase with the same structure, lint rules and scripts, so reviews focus on behavior rather than style.

**Scope**
- Create the app with `create-next-app`: App Router, TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`), `src/` directory, Tailwind CSS.
- ESLint (Next.js + TypeScript rules, `import/order`, no unused vars) and Prettier (with the Tailwind class-sorting plugin).
- Path alias `@/*` → `src/*`.
- Create the empty folder structure from [architecture.md](../architecture.md#code-structure) (`app/[locale]`, `components/ui`, `components/common`, `features/*`, `lib/*`, `types/`), each with a `.gitkeep` or short README.
- npm scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `format`, `format:check`.
- `.nvmrc` with the Node LTS version; `engines` field in `package.json`.
- Root README: prerequisites, install, run, and a link to `docs/`.

**Out of scope:** Auth, database, i18n and theming (separate tasks).

**Acceptance criteria**
- [ ] A fresh clone runs with `npm ci && npm run dev` and shows a placeholder page at `http://localhost:3000`.
- [ ] `npm run build`, `lint`, `typecheck` and `format:check` all pass with zero warnings.
- [ ] Introducing an unused variable or wrong import order makes `lint` fail.
- [ ] Folder structure matches the architecture doc.
- [ ] README setup steps work for a new developer without extra help.

**Depends on:** —

### E01-T02 · Supabase local setup & migrations workflow — `S`
**Why:** The schema must be versioned and reproducible so every developer, CI run and environment has the same database.

**Scope**
- `supabase init`; commit `supabase/config.toml`.
- First migration enables extensions `pg_trgm` and `unaccent` and creates an `immutable` wrapper function `f_unaccent(text)` (needed for generated columns and indexes).
- npm scripts: `db:start`, `db:stop`, `db:reset` (applies migrations + `seed.sql`), `db:new <name>`, `db:types` (writes `src/types/database.ts`).
- Empty `supabase/seed.sql` (filled in later epics).
- `.env.example` with every variable from the architecture doc and a one-line comment each.

**Out of scope:** Any application tables (they come with their feature epics).

**Acceptance criteria**
- [ ] `npm run db:start` starts local Supabase (Docker) and prints the local URL and keys.
- [ ] `npm run db:reset` drops and rebuilds the database from migrations without errors.
- [ ] `npm run db:types` creates `src/types/database.ts`, and running it twice produces no diff.
- [ ] `select f_unaccent('Ąžuolas')` returns `Azuolas`.
- [ ] `.env.example` contains every variable the app reads; no real secrets are committed.

**Depends on:** E01-T01

### E01-T03 · Supabase client helpers — `S`
**Why:** One place to create Supabase clients keeps token handling, typing and the service-role key safe and consistent.

**Scope**
- `lib/supabase/server.ts`: `createServerClient()` for Server Components, Server Actions and Route Handlers.
- `lib/supabase/client.ts`: `createBrowserClient()` for client components (singleton per tab).
- Both typed with `Database` from generated types and accept an `accessToken` callback (wired to Clerk in E04-T02; until then a stub).
- `lib/supabase/admin.ts`: service-role client, guarded with `import 'server-only'`, used only by webhooks/admin jobs.

**Out of scope:** Clerk integration itself (E04-T02).

**Acceptance criteria**
- [ ] A Server Component can query a test table through `createServerClient()` with full type inference (wrong column names fail `typecheck`).
- [ ] Importing `lib/supabase/admin.ts` from a client component fails the build.
- [ ] The service-role key does not appear in the client bundle (checked by grepping `.next/static`).
- [ ] Helpers have JSDoc explaining when to use each one.

**Depends on:** E01-T02 (token wiring finalized in E04-T02)

### E01-T04 · Testing setup — `M`
**Why:** RLS rules, metrics and logging flows are easy to break; automated tests at three levels (unit, database, end-to-end) catch this before release.

**Scope**
- **Unit/component:** Vitest + React Testing Library + `jsdom`; `npm test`, `npm run test:watch`, coverage report.
- **Database/RLS:** a test helper that signs JWTs for fake user ids (`sub`) with the local Supabase JWT secret, so tests can act as user A or B against local Supabase; `npm run test:db`.
- **E2E:** Playwright (Chromium + WebKit mobile viewport), `npm run e2e`; Clerk testing tokens plus a helper `signInAs(user)` that skips the Google UI.
- Test data factories (`createUser`, later `createSession`, …) in `tests/factories`.
- One passing example test of each kind.

**Out of scope:** Real feature tests (written with each feature).

**Acceptance criteria**
- [ ] `npm test`, `npm run test:db` and `npm run e2e` each run and pass on a clean checkout with local Supabase running.
- [ ] The example RLS test proves user B cannot read user A's row in a sample table.
- [ ] The example e2e test signs in a test user without the Google consent screen.
- [ ] Each test run starts from a known database state (reset or transaction rollback); tests don't depend on run order.
- [ ] Testing approach is documented in `docs/` or `tests/README.md`.

**Depends on:** E01-T02

### E01-T05 · CI pipeline — `S`
**Why:** Every PR must prove it builds, passes tests and keeps the schema valid before merge.

**Scope**
- GitHub Actions workflow on `pull_request` and `push` to `main`.
- Jobs: install (npm cache) → lint + typecheck + `format:check` → unit tests → start Supabase CLI, apply migrations on an empty DB, run `test:db` → `build` → Playwright e2e (upload report and traces on failure).
- Check that generated DB types are up to date (`db:types` then `git diff --exit-code`).
- Branch protection on `main`: required checks + 1 review.

**Out of scope:** Deployment (E01-T06).

**Acceptance criteria**
- [ ] A PR with a lint error, type error, failing test or broken migration is blocked from merging.
- [ ] A PR that changes a migration without regenerating types fails with a clear message.
- [ ] Playwright HTML report is downloadable from failed runs.
- [ ] Typical pipeline finishes in under ~8 minutes.

**Depends on:** E01-T04

### E01-T06 · Docker image for self-hosting — `S`
**Why:** The app runs on a self-hosted Coolify server, so it needs a small, secure, reproducible Docker image.

**Scope**
- `next.config` with `output: 'standalone'`.
- Multi-stage `Dockerfile` (deps → build → runtime) on Node LTS Alpine/slim; runtime runs as a non-root user; includes `sharp` for image optimization.
- `NEXT_PUBLIC_*` values passed as build arguments; server secrets read at runtime only (never baked into the image).
- `.dockerignore` (node_modules, .next, .git, tests, docs).
- Health check route `GET /api/health` (returns 200 and the app version; no auth, no DB secrets) and a `HEALTHCHECK` in the Dockerfile.
- `npm run docker:build` / `docker:run` scripts and a short section in the README.
- CI job builds the image on every PR (no push), so a broken Dockerfile is caught early.

**Out of scope:** Coolify setup and deployment pipeline (E01-T08).

**Acceptance criteria**
- [ ] `docker build` followed by `docker run` with an env file serves the app on port 3000 and passes the health check.
- [ ] The final image is under ~250 MB and runs as a non-root user.
- [ ] `docker history` / image inspection shows no server secrets (e.g. `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] `/api/health` responds 200 without signing in.
- [ ] CI fails if the image can't be built.

**Depends on:** E01-T01

### E01-T07 · Error tracking & shared Result type — `S`
**Why:** We need to know when something breaks in production, and every Server Action should return errors in the same shape so the UI can show translated messages.

**Scope**
- Error tracking (e.g. Sentry) for client, server and edge runtimes; release tagged with commit SHA; source maps uploaded; PII scrubbing (no emails in events).
- `lib/result.ts`: `type Result<T> = { ok: true; data: T } | { ok: false; error: ErrorCode; fields?: Record<string, ErrorCode> }` and helpers `ok()`, `fail()`.
- `ErrorCode` enum (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT`, `LOCKED`, `UNKNOWN`) mapped to i18n keys `errors.*`.
- `withAction()` wrapper: validates input with zod, catches errors, reports unexpected ones, returns `Result`.

**Out of scope:** Alerting rules (E10-T07).

**Acceptance criteria**
- [ ] A test error thrown in a Server Component and in a client component both appear in error tracking with the release tag and readable stack trace.
- [ ] Events contain no email addresses or auth tokens.
- [ ] An example Server Action using `withAction()` returns `{ ok: false, error: 'VALIDATION', fields }` for invalid input (unit tested).
- [ ] Every `ErrorCode` has an `errors.*` key (checked once i18n exists).

**Depends on:** E01-T01

### E01-T08 · Coolify environments & deployment pipeline — `M`
**Why:** Product and testers need a link to every change, and production releases to the self-hosted Coolify server must be repeatable, safe and easy to roll back.

**Scope**
- **Coolify server:** Coolify instance on our server (same region as Supabase), SSH key-only access, firewall allowing only 22/80/443, automatic OS security updates.
- **Coolify apps** (Dockerfile build pack, connected via the Coolify GitHub App):
  - **Production** app on the custom domain, tracking `main`, automatic deploy on push **off**.
  - **Preview deployments** enabled for pull requests (`pr-{n}.<staging-domain>`), using staging variables.
- **Variables:** build-time (`NEXT_PUBLIC_*`) and runtime secrets set per environment in Coolify; nothing in the repo.
- **Supabase Cloud:** **staging** project (used by previews) and **production** project.
- **Clerk Cloud:** dev instance for local/previews, production instance for production; allowed origins/redirect URLs and webhook endpoints set for the Coolify domains.
- **GitHub Action on merge to `main`:** `supabase db push` to staging, then to production; on success, trigger the Coolify production deploy via its API/webhook (token stored as a GitHub secret). A failed migration stops the deploy.
- Coolify health check on `/api/health`; deploy is marked failed if the new container isn't healthy (old container keeps running).
- **Runbook** in `docs/deployment.md`: how deploys work, how to roll back (redeploy previous image in Coolify), how to run a migration manually, how to rotate secrets, server access.

**Out of scope:** Custom domain DNS details and production Clerk Google consent screen (E10-T07); multi-instance scaling.

**Acceptance criteria**
- [ ] Opening a PR creates a Coolify preview URL that works against Supabase staging and Clerk dev (sign-in works).
- [ ] Closing/merging the PR removes its preview deployment.
- [ ] Merging to `main` applies new migrations and then deploys production without manual steps.
- [ ] A failing migration stops the production deploy, and the current production version keeps running.
- [ ] A deploy whose container fails the health check doesn't replace the running version.
- [ ] Rolling back to the previous version takes under 5 minutes by following the runbook.
- [ ] No secret values exist in the repository, Docker image or build logs; the server only accepts SSH keys.

**Depends on:** E01-T05, E01-T06
