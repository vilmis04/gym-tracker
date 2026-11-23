# Deployment runbook (Coolify)

How Gym Tracker gets from a merged pull request to production, how to set the pipeline up once, and what to do when something goes wrong (E01-T08). Background: [architecture → Environments / Deployment](architecture.md#environments). CI itself: [ci.md](ci.md).

Placeholders used below — replace them with the real names once they exist:

| Placeholder | Meaning | Example |
|---|---|---|
| `<prod-domain>` | Production app domain | `gymtracker.app` |
| `<staging-domain>` | Parent domain of the preview deployments | `staging.gymtracker.app` |
| `<coolify-domain>` | Coolify dashboard | `coolify.gymtracker.app` |
| `<server-ip>` | Public IP of the Coolify server | `203.0.113.10` |

No secret value is ever written into the repository, a workflow file, a Dockerfile or a build log. Secrets live in Coolify (app variables), in GitHub environments (migration + deploy credentials) and in a password manager.

## Contents

- [Overview](#overview)
- [One-time setup](#one-time-setup) (in order)
- [How a deploy works](#how-a-deploy-works)
- [Preview deployments](#preview-deployments)
- [Roll back (under 5 minutes)](#roll-back-under-5-minutes)
- [Migrations](#migrations)
- [Rotating secrets](#rotating-secrets)
- [Server access](#server-access)
- [Troubleshooting](#troubleshooting)
- [Go-live verification checklist](#go-live-verification-checklist)

## Overview

```
 pull request ──► Coolify preview  https://pr-<n>.<staging-domain>
                  (built by Coolify from the PR, staging variables:
                   Supabase staging + Clerk dev; removed when the PR closes)

 merge to main ─► GitHub Actions "CI" (.github/workflows/ci.yml)
                        │ success, event = push, branch = main
                        ▼
                  GitHub Actions "Deploy" (.github/workflows/deploy.yml), one at a time
                    1. Migrate staging      supabase db push → Supabase staging project
                    2. Migrate production   supabase db push → Supabase production project
                    3. Deploy production    Coolify API: pin commit, deploy, wait for "finished"
                                            then GET https://<prod-domain>/api/health until
                                            version == merged commit SHA
                        ▼
                  Coolify (self-hosted) builds the Dockerfile, starts the new container,
                  waits for its health check, then switches traffic (old container keeps
                  running if the new one is unhealthy)
```

| Environment | App | Database | Auth | Variables |
|---|---|---|---|---|
| Local | `next dev` / `npm run docker:run` | Supabase CLI (Docker) | Clerk dev instance | `.env.local` |
| Preview (per PR) | Coolify preview of the production app, `pr-{n}.<staging-domain>` | Supabase **staging** project | Clerk **dev** instance | Coolify → app → *Preview Deployment Environment Variables* |
| Production | Coolify production app on `<prod-domain>`, tracking `main`, auto-deploy **off** | Supabase **production** project | Clerk **production** instance | Coolify → app → *Production Environment Variables* |

There is no separate long-running staging app in E01-T08: the staging database is shared by all previews and is migrated on every merge before production.

## One-time setup

Do these in order. Each step says where it happens. Items marked **(E10-T07)** are launch-day work and only mentioned here.

### 1. Server

1. Rent one Ubuntu 24.04 LTS VM in the **same region as the Supabase projects** (e.g. both in Frankfurt / EU Central). Coolify's minimum is 2 vCPU / 2 GB RAM / 30 GB disk; with production + a few previews building Next.js, use **4 vCPU / 8 GB / 80 GB**.
2. Add your SSH **public** key when creating the VM (no password login). Log in as root once, then harden it:

   ```bash
   # Automatic security updates
   apt-get update && apt-get -y upgrade
   apt-get install -y unattended-upgrades ufw
   dpkg-reconfigure -f noninteractive unattended-upgrades   # enables the daily security run
   cat /etc/apt/apt.conf.d/20auto-upgrades                   # both values must be "1"

   # SSH: keys only (Coolify itself connects to localhost as root with its own key)
   cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
   PasswordAuthentication no
   KbdInteractiveAuthentication no
   PermitRootLogin prohibit-password
   PubkeyAuthentication yes
   EOF
   sshd -t && systemctl reload ssh

   # Firewall: only SSH, HTTP, HTTPS
   ufw default deny incoming
   ufw default allow outgoing
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw --force enable
   ufw status verbose
   ```

   Docker publishes container ports through iptables and bypasses ufw, so **also** create the same rule set (allow 22, 80, 443 inbound; deny everything else) in the cloud provider's firewall. That is what actually blocks Coolify's install-time port 8000 and any accidentally published container port.
3. DNS (at your DNS provider): `A <coolify-domain> → <server-ip>`, `A <prod-domain> → <server-ip>` **(E10-T07 for the final custom domain)**, and a wildcard `A *.<staging-domain> → <server-ip>` for previews.

### 2. Coolify

1. Install Coolify v4 on the server (official one-liner from the [Coolify docs](https://coolify.io/docs/get-started/installation); it installs Docker with BuildKit). During the install it listens on port 8000 — open it only from your IP in the provider firewall, or use an SSH tunnel (`ssh -L 8000:localhost:8000 root@<server-ip>`).
2. Create the admin account immediately, enable **2FA** for it, then set the instance domain to `https://<coolify-domain>` (Settings → General) so the dashboard is served over HTTPS by Coolify's proxy. Close port 8000 again.
3. Settings → **Advanced** → **API access: Enabled** (needed by the deploy workflow). Leave *Allowed IPs* empty (GitHub runner IPs change) or restrict it to GitHub's published Actions ranges.
4. Coolify's instance backup and disk-usage alerts are **(E10-T07)**.

### 3. Supabase Cloud

1. Create two projects in the same organization and region as the server: **gym-tracker-staging** and **gym-tracker-production**. Store each **database password** in the password manager.
2. Note for each: **project ref** (Project Settings → General), **Project URL** and **anon (public) key** and **service_role key** (Project Settings → API).
3. Nothing to do for extensions: the first migration creates `pg_trgm` and `unaccent` in the `extensions` schema, which exists on every Supabase project.
4. **Clerk as third-party auth provider (E04-T02)**, once the Clerk instances exist and their Supabase integration is active ([4. Clerk](#4-clerk), step 2): in each project, *Authentication* → *Sign In / Providers* → *Third-Party Auth* → *Add provider* → **Clerk**, and enter the domain Clerk showed when activating the integration (its Frontend API domain, without `https://`): staging → the Clerk **dev** instance (`<name>.clerk.accounts.dev`), production → the Clerk **production** instance (`clerk.<prod-domain>`). Supabase then accepts that instance's session tokens (and only those) and RLS sees the Clerk user id through `uid()`. Not set by the deploy workflow (it only runs `db push`); don't run `supabase config push` against these projects: `supabase/config.toml` keeps Clerk off for the local stack and would turn it off there.
5. Create an access token for the CLI: Account → **Access Tokens** → *Generate new token* (if scoped tokens are offered, give it only `projects_read`, `project_admin_read`, `database_write`, `database_pooling_config_read`). Prefer one token per environment, created from a dedicated account if you have one, with an expiry date.
6. The migrations of `supabase/migrations/` are applied by the deploy workflow on the first enabled run (see [Migrations](#migrations)). Point-in-time recovery/backups and seed data for production are **(E10-T07)**.

### 4. Clerk

1. **Dev instance** (already used locally and in CI e2e): used by every preview. Development instances accept any origin, so previews on `pr-{n}.<staging-domain>` work without per-PR configuration. Create the e2e test user there if you want to run e2e against a preview ([tests/README.md](../tests/README.md)).
2. **Sign-in methods (E04-T01), in both instances:** *Configure → User & authentication*:
   - *Email, phone, username*: turn **off** sign-in with email address (and its email code / link), password, phone and username, so the sign-in shows only "Continue with Google" (keep the email address as a user attribute: Google provides it).
   - *SSO connections* (*Social connections*): enable **Google** only, for sign-up and sign-in. The dev instance can use Clerk's shared Google credentials; the production instance needs its own Google OAuth client (consent screen, **(E10-T07)**), with the redirect URI Clerk shows.
   - *Restrictions*: sign-up mode **Public** (the first Google sign-in creates the account; the app has no separate sign-up page).
   - *Paths* (*Developers → Paths*): the app sets its sign-in URL per language in code (`/lt/sign-in`, `/en/sign-in`) and passes it to Clerk, so the *Component paths* can stay on the default. Set *Sign-in* / *Sign-up* to "Application domain" → `/lt/sign-in` if the dashboard asks, and *After sign-out* to `/` (the app itself returns to `/{locale}`). Don't set `NEXT_PUBLIC_CLERK_SIGN_IN_URL` & co. in Coolify.
   - Session token: leave the default lifetime.
   - **Account management (E04-T04)**, the dialog behind *Manage account* on the settings page (Clerk's `<UserProfile />`): *Configure → User & authentication* → **Delete accounts** (*Restrictions* / *Account deletion*, depending on the dashboard version) **off** until E10-T05 builds the full GDPR deletion — deleting through Clerk would only remove the profile row. Name editing: the app shows the name as "Managed by Google"; keep *First and last name* from being edited in Clerk (turn the attribute off, or leave it and accept that a changed name reaches `profiles` through `user.updated`).
   - **Supabase integration (E04-T02):** [dashboard.clerk.com/setup/supabase](https://dashboard.clerk.com/setup/supabase) (or *Configure → Integrations → Supabase*) → choose the instance → *Activate Supabase integration*. It adds `role: authenticated` to the session token, which Supabase needs to treat the user as signed in (without it requests act as `anon` and see no user data). Copy the *Clerk domain* it shows into the Supabase project ([3. Supabase Cloud](#3-supabase-cloud), step 4). No JWT template and no shared secret: Supabase checks the token with the instance's public keys.
3. **Production instance**: Clerk dashboard → *Create production instance* → domain `<prod-domain>`; add the DNS records Clerk shows (the domain/DNS part and the Google OAuth consent screen are **(E10-T07)**). Repeat step 2 there. Its keys (`pk_live_…`, `sk_live_…`) go only into the production variables; `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is a build-time value, so changing it needs a redeploy.
4. **Webhooks** (route `/api/webhooks/clerk`, E04-T03; keeps `profiles` in sync): Clerk dashboard → choose the instance → *Configure → Webhooks* → *Add endpoint* → *Subscribe to events* `user.created`, `user.updated`, `user.deleted` (nothing else; other events are acknowledged and ignored) → *Create*. Then open the endpoint and copy its *Signing Secret* (`whsec_…`) into `CLERK_WEBHOOK_SIGNING_SECRET` ([6. Variables](#6-variables); runtime only, then *Restart*). The route checks the Svix signature (and that it is at most 5 minutes old, so the server clock must be right — NTP is on by default) and answers 401 to anything else; without the variable it answers 500 and Clerk keeps retrying.
   - Production instance → `https://<prod-domain>/api/webhooks/clerk`; its secret goes into the **Production** variable.
   - Dev instance → there is no permanent preview URL, so point its endpoint at the preview you are testing (`https://pr-<n>.<staging-domain>/api/webhooks/clerk`) and edit the URL when needed; the signing secret stays the same, so the **Preview** variable `CLERK_WEBHOOK_SIGNING_SECRET` doesn't change. Previews write the **staging** project's `profiles`. Local development gets no webhooks (Clerk can't reach `localhost`; a tunnel such as `ngrok http 3000` with a second dev-instance endpoint works if you need them): the first-request fallback creates the profile, and name/photo changes then only arrive with the next webhook, i.e. never locally.
   - Check it: endpoint → *Testing* → send an example `user.updated` → *Message attempts* shows `200` with `{"status":"…"}` (`ignored_outdated` / `synced` for a real user; example users without a stored profile are created, so delete that test row in the table editor afterwards). Failed deliveries are retried by Clerk (Svix) with back-off for about three days and can be replayed from *Message attempts*; replays are safe (idempotent).
   - Without the webhook sign-in still works (the first-request fallback, `getCurrentProfile()`, creates the profile from Clerk), but name/photo changes and deletions don't reach `profiles`.

### 5. Coolify GitHub App and the production application

1. Coolify → **Sources** → *Add GitHub App*. During setup set **Preview deployment access** to *Read and update pull requests* (so it gets pull-request events and can comment preview links). Install it on `vilmis04/gym-tracker` only.
2. Coolify → **Projects** → *New project* `gym-tracker` → environment `production` → *New resource* → *Private repository (with GitHub App)* → this repo, branch `main`.
3. **General**
   - Build pack: **Dockerfile**; Base directory `/`; Dockerfile location `/Dockerfile`.
   - Ports exposes: **3000** (no *Ports mappings*: a host port mapping disables rolling updates).
   - Domains: `https://<prod-domain>`.
4. **Advanced**
   - *Deployment → Auto deploy*: **off** (the deploy workflow deploys after migrations). Turning it on would deploy before migrations — never do that.
   - *Build → Source commit availability*: **Available during build** (needed for `APP_VERSION=$SOURCE_COMMIT`).
   - *Build → Inject build args into Dockerfile* (`inject_build_args_to_dockerfile`): **off**. The Dockerfile declares exactly the ARGs it needs; injection would add an `ARG` for every build variable to every stage, which can put values into image metadata.
   - *Build secrets*: **Docker BuildKit secrets** (`use_build_secrets`). See [Build vs runtime variables](#6-variables) for why.
   - *Container naming*: keep the default (unique names); no custom container name or custom IP — those disable rolling updates.
   - *Operations → Stop grace period*: 30 s (default) is enough.
   - *Number of Docker images to keep* (`docker_images_to_keep`): **5**, so the last few releases can be rolled back instantly.
   - *Environment values in logs*: **Hide all values** (default).
5. **Healthcheck** → *HTTP*: method `GET`, scheme `http`, host `127.0.0.1`, port `3000`, path `/api/health`, expected code `200`, response text `"status":"ok"`, interval 10 s, timeout 5 s, retries 3, start period 30 s → *Save* → *Enable*. Coolify runs it inside the container with BusyBox `wget` (present in the image). Alternatively keep the dashboard check disabled: then Coolify uses the image's own `HEALTHCHECK` (also `/api/health`). Either way a deployment whose new container doesn't become healthy is marked **failed** and the old container keeps serving.
6. Write down the app's **UUID** (in the dashboard URL, `/application/<uuid>`), needed as `COOLIFY_APP_UUID`.

### 6. Variables

Set them on the production app: *Environment Variables* has two groups, **Production** and **Preview Deployment** (previews never see production values). For each variable choose *Build time* / *Runtime* availability as in the table. Lock (🔒) every secret.

| Variable | Build time | Runtime | Production value | Preview value | Secret? |
|---|:-:|:-:|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | production project URL | staging project URL | no (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | production anon key | staging anon key | no (public, RLS) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✓ | ✓ | `pk_live_…` (production instance) | `pk_test_…` (dev instance) | no (public) |
| `NEXT_PUBLIC_SITE_URL` | ✓ | — | `https://<prod-domain>` (no path; link previews: Open Graph image, `og:url`, canonical / hreflang links of the landing page, E04-T05) | unset (previews then point at `http://localhost:3000`; or the preview's own URL) | no (public) |
| `NEXT_PUBLIC_SENTRY_DSN` | ✓ | ✓ | Sentry DSN (optional) | same DSN (optional) | no (public) |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | ✓ | ✓ | `production` | `preview` | no |
| `SENTRY_ORG`, `SENTRY_PROJECT` | ✓ | — | Sentry slugs (optional) | same | no |
| `APP_VERSION` | ✓ | ✓ | `$SOURCE_COMMIT` | `$SOURCE_COMMIT` | no |
| `SENTRY_AUTH_TOKEN` | ✓ (build secret) | — | Sentry org token with `project:releases` (optional; source maps) | same or leave out | **yes** |
| `CLERK_SECRET_KEY` | — | ✓ | `sk_live_…` | `sk_test_…` | **yes** |
| `CLERK_WEBHOOK_SIGNING_SECRET` | — | ✓ | production endpoint secret | dev endpoint secret | **yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | — | ✓ | production service_role key | staging service_role key | **yes** |
| `SENTRY_DSN` | — | ✓ | optional server-only DSN override | optional | no |
| `ENABLE_TEST_ERROR_PAGE` | — | ✓ | unset (set `1` only for the smoke test) | unset | no |
| `ENABLE_DEV_PAGES` | — | ✓ | unset | unset (set `1` to review `/dev/tokens` on a preview, then remove) | no |

Notes:

- `NEXT_PUBLIC_SITE_URL` (E04-T05) is read while the landing page is prerendered, so it is build time only. A value that isn't an `http(s)` URL fails the build. Unset, the build only warns (`metadataBase … not set`) and link previews point at `localhost`, which is fine for previews of pull requests (they aren't shared outside the team).
- `NEXT_PUBLIC_*` values are inlined into the browser bundle at build time, so they must be build-time variables; changing one needs a **redeploy**, not a restart. Runtime-only changes need only *Restart*.
- `APP_VERSION=$SOURCE_COMMIT` is both build time (Sentry release in the bundle) and runtime (what `/api/health` reports, which the deploy workflow checks). With build secrets on, no build arg reaches the Dockerfile's runtime stage, so the runtime value is what `/api/health` shows.
- **Build secrets.** With *Docker BuildKit secrets* on, Coolify passes **every** build-time variable as `docker build --secret id=<NAME>,env=<NAME>` and no `--build-arg`s. The Dockerfile's `npm run build` step mounts each of the variables above as an optional secret (`/run/secrets/<NAME>`) and exports it for that one step, so `SENTRY_AUTH_TOKEN` is never stored in a layer, in `docker history` or in the deploy log (verified locally with both modes; Coolify leaves a `RUN` that already mounts secrets unchanged). Locally and in CI the same Dockerfile still takes build args, and the token as `--secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN` (README → Docker).
- **Fallback if build secrets aren't available** (the deploy log then says *"Docker on … does not support build secrets. Using traditional build arguments."*): Coolify falls back to `--build-arg`. The public variables keep working, but then **remove `SENTRY_AUTH_TOKEN` from Coolify** (no source-map upload from Coolify builds; Sentry still gets events, with minified stack traces) until the server's Docker supports BuildKit secrets (any Docker ≥ 23 with buildx does). Never put the token in as a plain build variable with *Inject build args* on.
- Never set server secrets as build-time variables: build-time values can end up in image metadata.

### 7. Preview deployments

On the production app → **Preview Deployments**:

1. *Enable preview deployments*.
2. *URL template*: `pr-{{pr_id}}.<staging-domain>` (e.g. `pr-{{pr_id}}.staging.gymtracker.app`; needs the wildcard DNS record from step 1).
3. *PR deployment access*: **Repository members only** (preview code runs on the server with staging secrets).
4. Fill in the **Preview Deployment Environment Variables** (staging Supabase, Clerk dev, `NEXT_PUBLIC_SENTRY_ENVIRONMENT=preview`).

Coolify creates a preview when a PR **into `main`** opens or updates and deletes it when the PR closes or merges. PRs whose base is another branch (stacked PRs) get no preview until their base becomes `main`. Previews are replaced without a rolling update (short downtime per push is fine).

### 8. Coolify API token for GitHub Actions

Coolify → **Keys & Tokens → API Tokens → New token**:

- Description `github-actions-deploy`, expiry **1 year** (put a renewal reminder in the calendar).
- Permissions: **`read`, `write`, `deploy`** — `deploy` queues deployments, `read` polls their status, `write` lets the workflow pin the app to the commit it just migrated (`git_commit_sha`). No `delete`, `read:sensitive` or `root`.
- Access: *Selected projects, environments, or resources* → only the production application.

### 9. GitHub environments, secrets and variables

Repository → **Settings → Environments**:

1. **New environment `staging`** → *Deployment branches and tags*: **Selected branches** → `main`. Environment secrets:

   | Secret | Value |
   |---|---|
   | `SUPABASE_ACCESS_TOKEN` | Supabase access token (step 3.5) |
   | `SUPABASE_PROJECT_REF` | staging project ref |
   | `SUPABASE_DB_PASSWORD` | staging database password |

2. **New environment `production`** → *Selected branches* → `main` (optional: *Required reviewers* to approve each production migration + deploy by hand). Environment secrets and variables:

   | Name | Kind | Value |
   |---|---|---|
   | `SUPABASE_ACCESS_TOKEN` | secret | Supabase access token |
   | `SUPABASE_PROJECT_REF` | secret | production project ref |
   | `SUPABASE_DB_PASSWORD` | secret | production database password |
   | `COOLIFY_URL` | secret | `https://<coolify-domain>` |
   | `COOLIFY_API_TOKEN` | secret | token from step 8 |
   | `COOLIFY_APP_UUID` | secret | production app UUID |
   | `PRODUCTION_URL` | variable | `https://<prod-domain>` |

3. **Settings → Secrets and variables → Actions → Variables → New repository variable** `DEPLOY_ENABLED` = `true`. Until this exists the Deploy workflow runs, prints *"Deploy skipped: … DEPLOY_ENABLED is not 'true'"* and stays green, so merging before the setup is finished never produces red runs. Set it **last**, after steps 1–8.
4. Branch protection on `main` (required check **CI passed**): [ci.md → Branch protection](ci.md#branch-protection-on-main-manual-one-time). Because previews and the deploy pipeline depend on `main` only receiving reviewed, green PRs, do this before enabling deploys.

### 10. First deploy

Actions → **Deploy** → *Run workflow* (branch `main`). It migrates staging, then production (all existing migrations, see [the fixture note](#migrations)), deploys and waits for `/api/health`. Then work through the [go-live verification checklist](#go-live-verification-checklist).

## How a deploy works

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on `workflow_run` of **CI** (`completed`, branch `main`) and continues only if CI **succeeded** for a **push** to `main` of this repository. It can also be run by hand on `main` (Actions → Deploy → Run workflow), which deploys `main`'s current commit, migrations included. `concurrency: deploy-production` (no cancelling) runs one deploy at a time; a newer one waits.

| Job | GitHub environment | What it does | If it fails |
|---|---|---|---|
| **Preflight** | — | Checks `DEPLOY_ENABLED`; skips everything with a notice when it isn't `true` | — |
| **Migrate staging** | `staging` | `npx supabase link --project-ref $SUPABASE_PROJECT_REF --yes`, `npx supabase db push --remote --dry-run` (lists pending migrations), `npx supabase db push --remote --yes` | Production is not touched; nothing is deployed |
| **Migrate production** | `production` | Same against the production project | Nothing is deployed; production keeps running the old version (already-applied staging migrations stay) |
| **Deploy production** | `production` | [`scripts/coolify-deploy.sh`](../scripts/coolify-deploy.sh): `PATCH /api/v1/applications/{uuid}` with `git_commit_sha=<sha>` (so exactly the migrated commit is built, never a newer `main`), `POST /api/v1/deploy?uuid=…&force=false`, polls `GET /api/v1/deployments/{id}` until `finished` (fails on `failed`/`cancelled`, or after 20 min). Then [`scripts/wait-for-health.sh`](../scripts/wait-for-health.sh) polls `https://<prod-domain>/api/health` until `version` equals the commit (5 min timeout) | The old container keeps running (Coolify only switches after the new one is healthy). Read the Coolify deployment log, linked by id in the job summary |

The Supabase CLI reads `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` from the environment (never on a command line) and connects through the Supabase connection pooler (GitHub runners have no IPv6). Each job checks its secrets first ([`scripts/require-env.sh`](../scripts/require-env.sh)) and names any missing one. The scripts are tested against a fake Coolify API/health server in `tests/unit/scripts/deploy-scripts.test.ts`.

To re-run only a failed step after fixing its cause, use *Re-run failed jobs* on the run; already-applied migrations are skipped by `db push`.

### Smoke test after a deploy

1. In Coolify set the runtime variable `ENABLE_TEST_ERROR_PAGE=1` → *Restart*.
2. Open `https://<prod-domain>/debug/error?throw=server` and click the client-error button on `/debug/error`.
3. Confirm both events in Sentry with release = commit SHA and readable stack traces (source maps).
4. Delete `ENABLE_TEST_ERROR_PAGE` → *Restart*.

## Preview deployments

- Open a PR into `main` → Coolify builds it with the preview variables and comments the URL `https://pr-<n>.<staging-domain>` on the PR (GitHub App). Each push redeploys it.
- Previews use the **staging** database, which only has migrations from `main`. A PR that adds a migration therefore runs against a schema without it: its preview shows the old schema until the PR is merged. Test schema changes locally (`npm run db:reset`) or apply the migration to staging by hand ([Run a migration manually](#run-a-migration-manually)) — the next deploy then just records it as applied.
- Close or merge the PR → Coolify deletes the preview's containers. Check under the app → *Preview Deployments* that it's gone; *Delete* removes a stuck one.
- E2E against a preview (optional, by hand): `E2E_BASE_URL=https://pr-<n>.<staging-domain> npm run e2e` with the Clerk dev keys and e2e user set ([tests/README.md](../tests/README.md)). Never point `npm run test:db` at a cloud project; it refuses non-local hosts.

## Roll back (under 5 minutes)

The app container is stateless, so rolling back = running the previous image again. The database is **not** rolled back (see [Migrations](#migrations)).

1. Coolify → production app → **Rollback** (lists the images kept, newest first, by commit SHA).
2. Pick the last good commit → **Rollback**. Coolify starts that image (no build, typically under a minute), waits for its health check and switches traffic.
3. Check: `curl -s https://<prod-domain>/api/health` → `version` is the old SHA.
4. Then fix forward: revert or fix the bad change in a PR. The next merge deploys normally.

Via API (same effect): `curl -X POST -H "Authorization: Bearer $COOLIFY_API_TOKEN" -H 'Content-Type: application/json' -d '{"commit":"<good sha>"}' https://<coolify-domain>/api/v1/applications/<uuid>/rollback`.

If the image is no longer kept: app → *General* → set the commit SHA field to the good SHA → **Deploy** (rebuilds, ~3–5 min), or run `scripts/coolify-deploy.sh` with `DEPLOY_SHA=<good sha>` from a machine with the token. Note that the deploy workflow pins the app's commit SHA on every deploy, so a plain *Redeploy* in Coolify rebuilds the last commit the workflow deployed.

## Migrations

**Migrations are forward-only.** A rollback or a failed deploy leaves already-applied migrations in place, and during a rolling update the old and new app versions run against the same schema. So every migration must be **backward-compatible with the version currently running** (expand/contract):

1. *Expand*: add tables/columns (nullable or with defaults), new functions, new policies. Deploy code that uses them.
2. *Contract*, in a **later** PR once nothing uses the old shape: drop/rename columns, tighten constraints.
3. Never rename or drop something the running version uses in the same PR that stops using it.

Other rules:

- Migration timestamps must keep increasing (`npm run db:new <name>`). `db push` refuses a migration older than the newest applied one instead of applying it out of order (we don't pass `--include-all`). If that happens, rename the file to a new timestamp.
- The dev/test fixture table `sample_notes` (`20261117215612_add_sample_notes_fixture.sql`) reaches staging and production with the first deploy and is dropped by `20261123213711_add_profiles.sql` (E04-T03; [data-model.md → Dev/test fixtures](data-model.md#devtest-fixtures-temporary)). It was RLS-protected and held no data.
- A migration that fails in staging stops the pipeline before production. Fix it with a **new** migration in a PR (the failed one was not recorded as applied, but any statements Postgres committed before the failure are there — Supabase runs each migration file in a transaction, so normally nothing is left).

### Run a migration manually

From a clean checkout of `main` (needs the access token and database password from the password manager):

```bash
export SUPABASE_ACCESS_TOKEN=…     # never commit, never paste into a ticket
export SUPABASE_DB_PASSWORD=…      # of the target project
npx supabase link --project-ref <staging or production ref>
npx supabase migration list --remote        # local vs remote
npx supabase db push --remote --dry-run     # what would be applied
npx supabase db push --remote               # asks for confirmation
```

Always staging first, then production. Or re-run the Deploy workflow (Actions → Deploy → Run workflow).

## Rotating secrets

Rotate immediately if a value may have leaked, otherwise yearly (and when someone with access leaves). After each change, check the app (`/api/health`, sign-in) and the next Deploy run.

| Secret | Where to create the new value | Where to update | Apply |
|---|---|---|---|
| `CLERK_SECRET_KEY` | Clerk → instance → *API keys* → create a new secret key | Coolify app variable (production or preview group) | *Restart*; then delete the old key in Clerk |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk → *Webhooks* → endpoint → *Rotate signing secret* | Coolify app variable | *Restart* |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | only changes with a new instance/domain | Coolify | **Redeploy** (build time) |
| `SUPABASE_SERVICE_ROLE_KEY` / anon key | Supabase → Project Settings → API (*JWT keys* / *API keys*: create new, then revoke old) | Coolify (service role: runtime; anon: build time) | Restart (service role) / **Redeploy** (anon) |
| `SUPABASE_DB_PASSWORD` | Supabase → Project Settings → Database → *Reset database password* | GitHub environment secret (`staging` / `production`) + password manager | next Deploy run |
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens → generate new, delete old | GitHub environment secrets (both) | next Deploy run |
| `COOLIFY_API_TOKEN` | Coolify → Keys & Tokens → API Tokens → *Roll* (or new + revoke) | GitHub `production` environment secret | next Deploy run |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens (organization token) → new, revoke old | Coolify build variable (build secret) | next deploy |
| Coolify admin password / 2FA | Coolify → Profile | password manager | — |
| SSH keys | see [Server access](#server-access) | `~/.ssh/authorized_keys` on the server | — |

## Server access

- Only SSH with keys: `ssh root@<server-ip>` (or a personal sudo user — recommended once more than one person needs access). Password and keyboard-interactive login are disabled ([step 1](#1-server)).
- Add a person: append their public key to `~/.ssh/authorized_keys` (one line, with a comment naming them). Remove a person: delete their line, rotate any secret they could read (Coolify variables are visible to Coolify admins).
- Coolify dashboard: `https://<coolify-domain>`, personal accounts with 2FA, team role *Member* unless they need admin.
- Logs: Coolify → app → *Logs* (runtime) and *Deployments* (build/deploy log). On the server: `docker ps`, `docker logs <container>`.
- Check the hardening any time: `sshd -T | grep -E 'passwordauthentication|kbdinteractive'` (both `no`), `ufw status`, `systemctl status unattended-upgrades`.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Deploy run says *"Deploy skipped: … DEPLOY_ENABLED"* | Expected until step 9.3 is done. |
| *"Missing secrets/variables: …"* | Add the named secret to that job's GitHub environment (names are case-sensitive). |
| Deploy workflow didn't run after a merge | It only runs when **CI** succeeded for the push to `main`. Check the CI run; re-run it, or run Deploy by hand. `workflow_run` workflows always run from the default branch's copy of `deploy.yml`. |
| `supabase link` / `db push` fails with an auth error | Access token expired or revoked, or wrong project ref / DB password in that environment. |
| `db push` refuses a migration "before the last migration" | Its timestamp is older than one already applied. Rename it to a new timestamp in a PR. |
| `db push` fails on a migration | Read the SQL error in the job log; fix with a new migration. Nothing was deployed. |
| Coolify API `401` | Token wrong/expired, or *API access* disabled in Coolify settings. `403`: token lacks `write`/`deploy` or doesn't include this app. `404`: wrong `COOLIFY_APP_UUID`. |
| Deployment `failed` in Coolify | Open the deployment log: build error (fix in a PR), or *health check failed* — the new container didn't answer `/api/health` in time; the old one is still serving. Check runtime logs of the failed container (missing runtime variable, crash on start). |
| *"did not report version … within 300s"* after a finished deployment | Traffic still goes to the old container or a cache: check Coolify proxy logs, `curl -v https://<prod-domain>/api/health`. If `version` is the package version (`0.1.0`), `APP_VERSION=$SOURCE_COMMIT` is missing as a **runtime** variable. |
| `NEXT_PUBLIC_*` value wrong in the browser | It's baked in at build time: change it and **Redeploy** (not Restart). With build secrets, check the deploy log says *"Build secrets are enabled"*. |
| Preview not created | PR base isn't `main`, previews disabled, wildcard DNS missing, the GitHub App lacks pull-request permission, or the author isn't a repo member. Load it by hand: *Preview Deployments → Load Pull Requests*. |
| Preview left over after closing a PR | App → *Preview Deployments* → *Delete*. |
| Container healthy in Docker but site shows *"No available server"* | Traefik has no healthy target: the dashboard health check fails (wrong port/host/path) while the image's own check passes. Compare both; host must be `127.0.0.1`, port `3000`. |
| Clerk webhook *Message attempts* show `401` | `CLERK_WEBHOOK_SIGNING_SECRET` isn't this endpoint's secret (each endpoint and instance has its own; after *Rotate* the old one stops working), or the server clock is more than 5 minutes off. Fix the variable and *Restart*, then replay the failed messages. |
| Clerk webhook *Message attempts* show `500` | Runtime log: `CLERK_WEBHOOK_SIGNING_SECRET is missing…` (set it) or `Could not sync/delete the profile` (Supabase unreachable, wrong `SUPABASE_SERVICE_ROLE_KEY`, or the E04-T03 migration missing). Clerk retries on its own; replay after fixing. |
| Signed-in user has no `profiles` row | Neither the webhook nor the fallback ran: check the webhook (above) and Sentry for `Could not sync the profile`; the fallback also needs the Clerk Supabase integration ([4. Clerk](#4-clerk), step 2), or it can't read the row through RLS and retries on every page. |
| Disk full on the server | Old images/build cache: Coolify → Server → *Docker cleanup* (scheduled cleanup is E10-T07). |

## Go-live verification checklist

These acceptance criteria of E01-T08 need the real server and cloud accounts, so they are verified here after the setup, not in CI. Record date + evidence (link/screenshot) next to each.

1. **Preview works** — open a small PR into `main`. Within a few minutes Coolify comments `https://pr-<n>.<staging-domain>`. Open it: the page loads, `/api/health` returns `{"status":"ok","version":"<PR head sha>"}`. From E04-T01 on: `/lt/sessions` sends you to `/lt/sign-in`, which shows only "Tęsti su Google"; sign in with Google via the Clerk **dev** instance works and returns to `/lt/sessions`; the avatar menu shows your Google name and photo and *Atsijungti* (Sign out) returns to `/lt`; and data comes from Supabase **staging** (check a row in the staging table editor). From E04-T02 on, Supabase accepts the Clerk token: signed in on the preview, run `await window.Clerk.session.getToken()` in the browser console and call `curl -X POST "$STAGING_URL/rest/v1/rpc/uid" -H "apikey: $STAGING_ANON_KEY" -H "Authorization: Bearer <token>"`: it returns your Clerk user id (`"user_…"`); the same token with one character of its signature changed, or one from the production instance, answers 401. Repeat against production with a token from `<prod-domain>`.
2. **Preview removed** — close (or merge) that PR. Within a minute the preview disappears from *Preview Deployments* and `https://pr-<n>.<staging-domain>` no longer answers with the app.
3. **Merge → migrate → deploy** — merge a PR containing a harmless new migration (e.g. `comment on table public.profiles is 'E01-T08 deploy check';`). Without touching anything: CI goes green, Deploy runs *Migrate staging → Migrate production → Deploy production*, `supabase migration list --remote` shows the migration in both projects, and `https://<prod-domain>/api/health` reports the merge commit.
4. **Failed migration stops the deploy** — without breaking `main`: temporarily change the `staging` environment secret `SUPABASE_DB_PASSWORD` to a wrong value and run Actions → Deploy → *Run workflow* on `main`. *Migrate staging* fails, *Migrate production* and *Deploy production* are **skipped**, and `/api/health` still reports the previous commit. Restore the secret and re-run. (The same `needs` chain stops the deploy when the SQL of a migration fails; to see that too, run `npx supabase db push --remote` of a deliberately broken migration against staging from a local branch, never merge it.)
5. **Unhealthy container doesn't replace the running one** — in Coolify temporarily change the health check path to `/does-not-exist` and *Redeploy*: the deployment is marked **failed**, the log shows the health check failing, and the site keeps serving (`/api/health` unchanged). Restore `/api/health`.
6. **Rollback under 5 minutes** — start a timer, follow [Roll back](#roll-back-under-5-minutes) to the previous image, confirm `/api/health` shows the old SHA, stop the timer (target < 5 min). Roll forward again by re-running the last Deploy.
7. **No secrets in the repo, image or logs** — `git grep -nE 'sk_(live|test)_|sbp_|service_role' -- ':!docs'` finds nothing; on the server `docker history --no-trunc <prod image>` and `docker inspect <prod image>` show no `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_AUTH_TOKEN` values; the Coolify deployment log shows *"Build secrets are enabled"* and no secret values; the GitHub Actions logs show only `***` for secrets.
8. **SSH keys only** — from another machine: `ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password root@<server-ip>` → `Permission denied (publickey)`. `nmap -Pn <server-ip>` (or the provider's firewall view) shows only 22, 80, 443 open.
9. **Smoke test** — [Smoke test after a deploy](#smoke-test-after-a-deploy) shows server and client errors in Sentry with the release SHA.
10. **Profiles sync (E04-T03)** — sign in on a preview with a Google account that has never used the app: within 5 seconds the staging `profiles` table has its row (name, lowercase email, photo URL). Change the Clerk user's name in the Clerk dashboard (*Users* → user → edit): within a minute the row's `display_name` follows, and the webhook's *Message attempts* show `200` `{"status":"synced"}`. Replay that message: `200` `{"status":"ignored_outdated"}`, nothing changes. `curl -X POST https://pr-<n>.<staging-domain>/api/webhooks/clerk -d '{}'` answers `401`. Delete a test user in Clerk: its row is gone. Repeat the first and last step against production.
11. **Preferences follow the user (E04-T04)** — on a preview, signed in on one browser (or phone), open *Settings* (avatar menu), pick English and Dark: each shows "Saved" / "Išsaugota", and the staging `profiles` row has `locale = en`, `theme = dark` and `preferences_updated_at` set. In a different browser (a private window is not enough if it shares nothing: use another browser or device, Lithuanian UI), sign in with the same Google account: the first page switches to `/en/…` in the dark theme. Switch back to Lietuvių there; reload: it stays Lithuanian. *Manage account* opens Clerk's dialog in the page's language, with no *Delete account* section. Repeat on production.
