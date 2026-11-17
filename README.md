# Gym Tracker

Track gym sessions together with your gym buddies: log weights, reps and notes for everyone in the session and follow progress over time.

Stack: Next.js · Clerk (Google login) · Supabase · Tailwind. Languages: EN / LT. Light and dark themes.

See [docs/](docs/README.md) for the product vision, architecture, data model, design system, roadmap and backlog.

## Prerequisites

- **Node.js 22** (LTS) — the exact major is pinned in [`.nvmrc`](.nvmrc); with nvm run `nvm use`
- **npm 10+** (ships with Node 22)
- Git

## Getting started

```bash
git clone https://github.com/vilmis04/gym-tracker.git
cd gym-tracker
nvm use        # optional, picks Node from .nvmrc
npm ci         # install exact versions from package-lock.json
npm run dev    # start the dev server
```

Open [http://localhost:3000](http://localhost:3000) — you should see the placeholder page.

## Scripts

| Script                 | What it does                                            |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Start the Next.js dev server on port 3000               |
| `npm run build`        | Production build                                        |
| `npm start`            | Serve the production build (run `build` first)          |
| `npm run lint`         | ESLint; fails on any warning (`--max-warnings 0`)       |
| `npm run typecheck`    | Generate Next.js route types, then `tsc --noEmit`       |
| `npm run format`       | Format all files with Prettier (sorts Tailwind classes) |
| `npm run format:check` | Check formatting without writing (used by CI)           |

Before opening a PR run `npm run lint && npm run typecheck && npm run format:check && npm run build`.

## Project structure

Code lives in `src/` and follows [docs/architecture.md → Code structure](docs/architecture.md#code-structure). Import from `src/` with the `@/` alias, e.g. `import { x } from "@/lib/utils/x"`.
