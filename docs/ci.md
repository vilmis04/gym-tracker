# CI (GitHub Actions)

Every pull request (to any branch, so stacked PRs run too) and every push to `main` runs [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). It can also be started by hand (Actions → CI → Run workflow). A new push to a PR cancels that PR's previous run; runs on `main` always finish.

When CI succeeds on a push to `main`, the separate **Deploy** workflow ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)) migrates Supabase staging and production and deploys to Coolify; see [deployment.md → How a deploy works](deployment.md#how-a-deploy-works). It is not a PR check.

## Jobs

All jobs run **in parallel** on `ubuntu-latest`; each checks out the code and (except **Docker image**, which installs inside the image) runs the shared setup ([`.github/actions/setup`](../.github/actions/setup/action.yml): Node from `.nvmrc`, npm cache, `npm ci`). The run takes as long as the slowest job (E2E, a few minutes), well under the ~8 minute target.

| Check name (job)                   | What it runs                                                                                                                       | Fails when                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Lint, typecheck, format** (`checks`) | `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run check:contrast`, `npm run check:colors`, `npm run i18n:check` (all always run, so one push shows every problem) | any ESLint warning/error, type error, unformatted file, a design-token pair below WCAG AA, a raw color literal in `src/` outside `src/app/globals.css` (annotated inline on the PR), a translation problem in `messages/*.json` (see below; annotated on the file) |
| **Unit tests** (`unit`)            | `npm run test:coverage` (Vitest `unit` project, coverage printed in the log)                                                       | a failing unit/component test                                 |
| **Database tests & types** (`db`)  | `npx supabase start` on an **empty** database (applies every migration + `seed.sql`), then the types check, then `npm run test:db` | a broken migration, out-of-date `src/types/database.ts`, a failing RLS/DB test |
| **Build** (`build`)                | `npm run build` with no Sentry variables (the build must not need a Sentry account)                                                | the production build fails                                    |
| **Docker image** (`docker`)        | builds the [`Dockerfile`](../Dockerfile) with Buildx (no push; layers cached in the GitHub Actions cache), starts the container and waits for its `HEALTHCHECK`, checks it doesn't run as root and that `/api/health` returns the commit SHA | the image doesn't build, the container isn't healthy within ~60 s, runs as root, or `/api/health` is wrong |
| **E2E tests** (`e2e`)              | installs Playwright Chromium + WebKit (cached per Playwright version), `CI=1 npm run e2e` — Playwright builds the app and serves it with `next start` on port 3000. The build's Sentry DSN points at a fake ingest server the error-tracking spec runs (`NEXT_PUBLIC_SENTRY_DSN=http://public@127.0.0.1:8999/1`, `ENABLE_TEST_ERROR_PAGE=1`, `APP_VERSION=<sha>`; `ENABLE_DEV_PAGES=1` serves `/dev/tokens` for the design-tokens spec; [tests/README.md](../tests/README.md#error-tracking-fake-sentry)) | a failing spec on `chromium-desktop` or `webkit-mobile`       |
| **CI passed** (`ci-passed`)        | waits for all jobs above                                                                                                           | any of them failed or was cancelled                           |

**CI passed** is the single check branch protection requires, so adding a job only means listing it in `ci-passed.needs`.

### Database job details

- Only the services the tests need are started: Postgres, PostgREST, Kong (API gateway) and GoTrue (without it `supabase status` doesn't print the API keys). Excluded with `-x`: `realtime, storage-api, imgproxy, mailpit, postgres-meta, studio, edge-runtime, logflare, vector, supavisor`. `supabase gen types` doesn't need `postgres-meta` running.
- The DB tests read the local URLs and keys from `supabase status -o env` (see [tests/README.md](../tests/README.md#database-and-rls-tests)); no secrets are involved.
- **Types check:** `npm run db:types` then `git diff --exit-code -- src/types/database.ts`. If a migration changed without regenerating the types, the job fails with:

  > src/types/database.ts is out of date with supabase/migrations. Run 'npm run db:reset && npm run db:types' locally and commit the regenerated file.

  `db:types` is deterministic, so an unchanged schema never produces a diff.

### Translations check

`npm run i18n:check` ([`scripts/check-i18n.mts`](../scripts/check-i18n.mts), E03-T04; under a second) compares every `messages/*.json` with `messages/en.json` and prints one line per problem, then exits 1:

```
messages/en.json: missing key "nav.extra"
messages/lt.json: empty value for "common.back"
messages/lt.json: "counts.sets": the plural {count} is missing many (this locale needs one, few, many, other)
messages/lt.json: invalid ICU syntax in "counts.reps": EXPECT_ARGUMENT_CLOSING_BRACE at line 1, column 1
messages/lt.json: missing key "counts.weeks"
messages/lt.json: "ui.remove" uses the arguments {name} but messages/en.json uses {item}

6 translation problems in messages/en.json, messages/lt.json. Every key needs a non-empty message in every file; see README → Adding a string.
```

In CI each line is also a `::error file=…` annotation on the messages file. A file that isn't valid JSON or isn't a tree of strings stops the check with exit code 2. How to add a string: [README → Design tokens and dev pages → Adding a string](../README.md#design-tokens-and-dev-pages).

### Reading a failed E2E run

When the E2E job fails it uploads two artifacts (kept 14 days), listed at the bottom of the run's **Summary** page:

- `playwright-report` — the HTML report. Download, unzip, then `npx playwright show-report <folder>`.
- `playwright-test-results` — traces (recorded on the first retry; CI retries twice) and screenshots. Open a trace with `npx playwright show-trace <trace.zip>` or at [trace.playwright.dev](https://trace.playwright.dev).

Failures are also annotated inline on the PR's **Files changed** tab (Playwright's `github` reporter).

### Flaky failures

- **Database job: `port 54322 already in use`** (seen once while `supabase start` started Postgres). A runner-side one-off; *Re-run failed jobs* fixes it. If it repeats, check that no step starts a second Supabase stack.

## Secrets and variables

None are required today. Optional, set under **Settings → Secrets and variables → Actions**:

| Name                                | Kind     | Used by | Purpose                                                                   |
| ----------------------------------- | -------- | ------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | secret   | e2e     | Clerk **dev** instance publishable key — enables the signed-in e2e specs   |
| `CLERK_SECRET_KEY`                  | secret   | e2e     | Clerk **dev** instance secret key (never production; `clerkSetup()` refuses it) |
| `E2E_CLERK_USER_EMAIL`              | variable | e2e     | Override the e2e test user (default `e2e-user+clerk_test@example.com`)    |

No Sentry secret is used in CI: PR builds never upload source maps (that happens in the Coolify build, with `SENTRY_AUTH_TOKEN` as a build secret; [deployment.md → Variables](deployment.md#6-variables)).

The deploy workflow's secrets (Supabase, Coolify) are **environment** secrets of the `staging` and `production` GitHub environments, not repository secrets, and are never available to CI or pull requests: [deployment.md → GitHub environments](deployment.md#9-github-environments-secrets-and-variables).

Without both Clerk keys the specs that need a signed-in user are skipped with a reason: since E04-T01 that is every spec of the signed-in area (`app-layout.spec.ts`, the avatar-menu test in `language-switcher.spec.ts`, the Clerk part of `sign-in.spec.ts`). The rest still runs, including the redirect of signed-out users to sign-in (the app fails closed without keys). **Set both secrets (dev instance) and create the e2e test user** to get that coverage back; then the e2e job is the real check for sign-in. Secrets are not passed to PRs from forks, so there they stay skipped.

## Branch protection on `main` (manual, one-time)

This has to be set by a repository admin in the GitHub UI; the workflow can't configure it. It needs one CI run first, so the check name is known to GitHub.

**With a ruleset (recommended):** Settings → **Rules → Rulesets** → **New ruleset → New branch ruleset**

1. Name: `main`. Enforcement status: **Active**.
2. Target branches: **Add target → Include default branch** (or by pattern `main`).
3. Enable **Restrict deletions** and **Block force pushes**.
4. Enable **Require a pull request before merging**: Required approvals **1**; also tick **Dismiss stale pull request approvals when new commits are pushed** and **Require conversation resolution before merging**. Allowed merge methods: **Squash**.
5. Enable **Require status checks to pass**: tick **Require branches to be up to date before merging**, then **Add checks** → search `CI passed` and pick it (source: GitHub Actions).
6. **Create**.

**Or with classic branch protection:** Settings → **Branches → Add branch protection rule** → Branch name pattern `main` → **Require a pull request before merging** (Required approvals: 1, dismiss stale approvals) → **Require status checks to pass before merging** (Require branches to be up to date; search and add `CI passed`) → **Require conversation resolution before merging** → **Save changes**.

Requiring only `CI passed` covers every job. If you prefer to see each one listed, you can also require `Lint, typecheck, format`, `Unit tests`, `Database tests & types`, `Build`, `Docker image` and `E2E tests`, but then every new or renamed job must be updated in the rule too.

With a single maintainer, GitHub doesn't let you approve your own PR; add the maintainer to the ruleset's **Bypass list** (or leave approvals at 0) until a second reviewer exists.

## Running the same checks locally

```bash
npm run lint && npm run typecheck && npm run format:check && npm run check:contrast && npm run check:colors && npm run i18n:check
npm test
npm run db:start && npm run db:reset && npm run db:types && git diff --exit-code src/types/database.ts && npm run test:db
npm run build
npm run docker:build && docker run -d --name app -p 3000:3000 gym-tracker && sleep 3 && curl localhost:3000/api/health
CI=1 npm run e2e      # production build, like CI
```

Workflow files are linted with [actionlint](https://github.com/rhysd/actionlint) (`actionlint` in the repo root) and formatted by Prettier like everything else.

## Conventions for workflow changes

- GitHub's own `actions/*` are pinned to a **major version tag** (`actions/checkout@v7`). Any other action is pinned to a full commit SHA with the version in a comment, e.g. `docker/build-push-action@c3c9e263… # v7.4.0` (look up a tag's SHA with `git ls-remote https://github.com/docker/build-push-action refs/tags/v7.4.0`).
- Default `permissions: contents: read`; a job that needs more (e.g. `packages: write`) asks for it on that job only.
- Job `name`s are the check names branch protection refers to — don't rename them casually.
- Reuse `./.github/actions/setup` (with `next-cache: true` in jobs that run `next build`) in new jobs and workflows.
- Non-trivial shell goes into `scripts/*.sh` (bash, `set -euo pipefail`, checked with [shellcheck](https://www.shellcheck.net)) so it can be run and tested locally, like `scripts/coolify-deploy.sh` (tests in `tests/unit/scripts/`).
- Credentials for anything outside CI (Supabase Cloud, Coolify) are **environment** secrets on the `staging` / `production` GitHub environments (restricted to `main`), never repository secrets.
