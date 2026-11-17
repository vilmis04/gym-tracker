# Roadmap

## Milestones

| Milestone | Outcome | Epics | Demo |
|---|---|---|---|
| **M1 · Walking skeleton** | Deployed app, Google login, themed bilingual shell | E01, E02, E03, E04 | Sign in with Google, switch LT/EN and light/dark, see empty Home |
| **M2 · Train together** | Full core loop: buddies → session → log sets for everyone | E05, E06, E07, E08 | Two users run a shared session and log on two phones |
| **M3 · See progress** | Dashboards with session and exercise slices | E09 | Show 3 months of seeded history as charts |
| **M4 · Launch** | Quality, privacy, production readiness | E10 | Public MVP |

## Epic dependency graph

```
E01 Foundation ──┬──> E02 Design system ──┐
                 ├──> E03 i18n ───────────┤
                 └──> E04 Auth & profile ─┴──> E05 Gym buddies ──> E07 Gym sessions ──┐
                                           └──> E06 Exercise catalog ─────────────────┴──> E08 Session logging ──> E09 Dashboards ──> E10 Launch
```

## Suggested delivery order

Sizes: **S** ≤ 1 day, **M** 1–3 days (one developer). Estimates are rough and intended for sequencing, not commitments.

| Sprint (2 wk) | Focus | Tasks |
|---|---|---|
| 1 | Skeleton | E01-T01…T07, E02-T01, E03-T01, E04-T01, E04-T02 |
| 2 | Shell & profile | E02-T02…T06, E03-T02…T04, E04-T03…T05 |
| 3 | Buddies & catalog | E05-T01…T04, E06-T01…T03, E06-T05 |
| 4 | Sessions | E06-T04, E06-T06, E07-T01…T05, E07-T07 |
| 5 | Logging | E08-T01…T06, E07-T06, E03-T05 |
| 6 | Realtime & dashboards | E08-T07, E09-T01…T03, E05-T05, E06-T07 |
| 7 | Dashboards & polish | E09-T04…T06, E08-T08, E05-T06, E10-T01, E10-T06 |
| 8 | Launch | E10-T02…T05, E10-T07 |

Parallel tracks are possible after Sprint 2: one developer on E05 → E07, another on E06.

## Definition of Ready

A task is ready when it has: a clear description, testable acceptance criteria, dependencies merged or mocked, and designs/wireframes for any new screen.

## Definition of Done

- [ ] Acceptance criteria met and demoed on the preview deployment
- [ ] All UI strings translated in **EN and LT**
- [ ] Verified in **light and dark** mode and at 360 px mobile width
- [ ] Uses design tokens only; keyboard accessible; labels for assistive tech
- [ ] DB changes via migration, RLS policies + RLS tests included, types regenerated
- [ ] Unit tests for logic; e2e test updated if a user flow changed
- [ ] Lint, typecheck and CI green; reviewed by one other person
- [ ] Docs updated if behavior or schema changed
