# Gym Tracker — Documentation

Gym Tracker is a clean, minimal web app for logging workouts together with friends ("gym buddies"). You plan a session, invite buddies, log weights, reps and notes for everyone in the session, and track progress over time.

## Document map

| Document | Purpose |
|---|---|
| [requirements.md](requirements.md) | Original raw requirements (kept as the source input) |
| [product/vision.md](product/vision.md) | Vision, personas, scope, glossary, product decisions |
| [architecture.md](architecture.md) | Tech stack, system design, auth flow, security model, conventions |
| [data-model.md](data-model.md) | Database schema, relationships, RLS policies, key queries |
| [design-system.md](design-system.md) | Earth-tone pastel palette, typography, components, dark/light |
| [roadmap.md](roadmap.md) | Milestones, epic order, dependencies |
| [backlog.md](backlog.md) | All tasks with scope and acceptance criteria in one page (generated from `epics/` by `scripts/generate-backlog.py`) |
| [epics/](epics/) | One file per epic with detailed tasks and acceptance criteria |
| [open-questions.md](open-questions.md) | Decisions still to confirm with stakeholders |

## How the backlog is organized

- **Epic** (`E01`–`E10`): a feature area that delivers user value on its own.
- **Task** (`E05-T03`): one unit of work, one pull request, sized **S** (≤ 1 day) or **M** (1–3 days). Anything bigger than M is split.
- Every task has a description, acceptance criteria, and dependencies.
- The [Definition of Done](roadmap.md#definition-of-done) applies to every task.
