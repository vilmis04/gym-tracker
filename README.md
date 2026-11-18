# Gym Tracker

Track gym sessions together with your gym buddies: log weights, reps and notes for everyone in the session and follow progress over time.

Stack: Next.js · Clerk (Google login) · Supabase · Tailwind. Languages: EN / LT. Light and dark themes.

See [docs/](docs/README.md) for the product vision, architecture, data model, design system, roadmap and backlog.

## Prerequisites

- **Node.js 22** (LTS) — the exact major is pinned in [`.nvmrc`](.nvmrc); with nvm run `nvm use`
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

Open [http://localhost:3000](http://localhost:3000) — you should see the placeholder page.

## Scripts

| Script                  | What it does                                                           |
| ----------------------- | ---------------------------------------------------------------------- |
| `npm run dev`           | Start the Next.js dev server on port 3000                              |
| `npm run build`         | Production build                                                       |
| `npm start`             | Serve the production build (run `build` first)                         |
| `npm run lint`          | ESLint; fails on any warning (`--max-warnings 0`)                      |
| `npm run typecheck`     | Generate Next.js route types, then `tsc --noEmit`                      |
| `npm run format`        | Format all files with Prettier (sorts Tailwind classes)                |
| `npm run format:check`  | Check formatting without writing (used by CI)                          |
| `npm run db:start`      | Start local Supabase (Docker); prints the local URLs and keys          |
| `npm run db:stop`       | Stop local Supabase (data is kept in Docker volumes)                   |
| `npm run db:status`     | Print the local URLs and keys again                                    |
| `npm run db:reset`      | Drop and rebuild the local DB from migrations + `seed.sql`             |
| `npm run db:new <name>` | Create an empty migration `supabase/migrations/<timestamp>_<name>.sql` |
| `npm run db:types`      | Regenerate `src/types/database.ts` from the local DB                   |

Before opening a PR run `npm run lint && npm run typecheck && npm run format:check && npm run build`.

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

Commit the migration and the regenerated `src/types/database.ts` in the same PR. `db:types` is deterministic: running it on an unchanged schema produces no diff (CI will enforce this from E01-T05). Never edit a migration that has already been merged; add a new one.

**Search helpers.** The first migration enables `pg_trgm` and `unaccent` (in the `extensions` schema) and adds `public.f_unaccent(text)`, an `immutable` wrapper you can use in generated columns and indexes, e.g. `lower(f_unaccent(trim(name)))`; `select f_unaccent('Ąžuolas')` returns `Azuolas`. Trigram indexes use `extensions.gin_trgm_ops`.

**Troubleshooting.** If ports 54320–54329 are taken, stop the other stack (`npx supabase stop --project-id <id>`) or change the ports in `supabase/config.toml`. `npm run db:stop -- --no-backup` also deletes the local data volumes.

## Project structure

Code lives in `src/` and follows [docs/architecture.md → Code structure](docs/architecture.md#code-structure). Import from `src/` with the `@/` alias, e.g. `import { x } from "@/lib/utils/x"`.
