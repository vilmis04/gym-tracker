# Backlog

One-page index of every task. Details and acceptance criteria are in each epic file. Sizes: **S** ≤ 1 day, **M** 1–3 days.

## [E01 · Project Foundation](epics/E01-foundation.md)
_Milestone: M1 · Walking skeleton_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E01-T01 | Bootstrap Next.js app | S | — |
| E01-T02 | Supabase local setup & migrations workflow | S | E01-T01 |
| E01-T03 | Supabase client helpers | S | E01-T02 (token wiring finalized in E04-T02) |
| E01-T04 | Testing setup | M | E01-T02 |
| E01-T05 | CI pipeline | S | E01-T04 |
| E01-T06 | Environments & deployment | S | E01-T05 |
| E01-T07 | Error tracking & app shell result type | S | E01-T01 |

## [E02 · Design System & Theming](epics/E02-design-system.md)
_Milestone: M1 · Walking skeleton_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E02-T01 | Design tokens & Tailwind theme | M | E01-T01 |
| E02-T02 | Light / dark mode | S | E02-T01 |
| E02-T03 | Base UI components | M | E02-T01 |
| E02-T04 | Searchable Combobox component | M | E02-T03 |
| E02-T05 | NumberStepper component | S | E02-T03 |
| E02-T06 | App layout & navigation | M | E02-T03, E03-T01 |

## [E03 · Internationalization (EN / LT)](epics/E03-i18n.md)
_Milestone: M1 · Walking skeleton_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E03-T01 | next-intl setup & locale routing | M | E01-T01 |
| E03-T02 | Language switcher & persistence | S | E03-T01, E04-T04 |
| E03-T03 | Formatting helpers | S | E03-T01 |
| E03-T04 | Missing-key check in CI | S | E03-T01, E01-T05 |
| E03-T05 | Translated catalog content | S | E06-T01 |

## [E04 · Authentication & Profile](epics/E04-auth.md)
_Milestone: M1 · Walking skeleton_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E04-T01 | Clerk with Google sign-in | S | E01-T01, E03-T01 |
| E04-T02 | Clerk ↔ Supabase integration | S | E04-T01, E01-T03 |
| E04-T03 | Profiles table & sync | M | E04-T02 |
| E04-T04 | Settings page | S | E04-T03, E02-T02 |
| E04-T05 | Public landing page | S | E04-T01, E02-T03 |

## [E05 · Gym Buddies](epics/E05-gym-buddies.md)
_Milestone: M2 · Train together_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E05-T01 | Buddy schema, RLS & helpers | M | E04-T03 |
| E05-T02 | Find users & send request | M | E05-T01, E02-T04 |
| E05-T03 | Incoming / outgoing requests | S | E05-T01 |
| E05-T04 | Buddy list | S | E05-T01 |
| E05-T05 | Invite link | S | E05-T02 |
| E05-T06 | In-app notifications for buddy events | S | E05-T03 |

## [E06 · Exercise Catalog](epics/E06-exercise-catalog.md)
_Milestone: M2 · Train together_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E06-T01 | Catalog schema & seed | M | E04-T03 |
| E06-T02 | Exercise search RPC | S | E06-T01 |
| E06-T03 | Exercise picker (autocomplete) | M | E06-T02, E02-T04 |
| E06-T04 | Create / edit exercise form | M | E06-T03, E06-T05 |
| E06-T05 | Rule-based auto-tagging | S | E06-T01 |
| E06-T06 | Machine management | S | E06-T01, E02-T04 |
| E06-T07 | Exercise library page | S | E06-T02 |

## [E07 · Gym Sessions](epics/E07-gym-sessions.md)
_Milestone: M2 · Train together_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E07-T01 | Session schema, RLS & lifecycle | M | E05-T01 |
| E07-T02 | Create session | M | E07-T01, E02-T04 |
| E07-T03 | Sessions list | S | E07-T01 |
| E07-T04 | Respond to invitations | S | E07-T01 |
| E07-T05 | Session detail & management | M | E07-T01 |
| E07-T06 | Edit lock after completion | S | E07-T01 |
| E07-T07 | Home screen | S | E07-T03 |

## [E08 · Session Logging](epics/E08-session-logging.md)
_Milestone: M2 · Train together_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E08-T01 | Logging schema & RLS | M | E07-T01, E06-T01 |
| E08-T02 | Add exercise to session | S | E08-T01, E06-T03 |
| E08-T03 | Last attempt RPC | S | E08-T01 |
| E08-T04 | Exercise card with per-participant logging | M | E08-T02, E02-T05 |
| E08-T05 | Auto-load last attempt | M | E08-T03, E08-T04 |
| E08-T06 | Notes per participant per exercise | S | E08-T01, E08-T04 |
| E08-T07 | Realtime sync between participants | M | E08-T04 |
| E08-T08 | Personal record highlight | S | E08-T04, E09-T01 |

## [E09 · Progress Dashboards](epics/E09-progress-dashboards.md)
_Milestone: M3 · See progress_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E09-T01 | Metrics library & RPCs | M | E08-T01 |
| E09-T02 | Dashboard: user per session | M | E09-T01, E07-T05 |
| E09-T03 | Dashboard: user per exercise | M | E09-T01 |
| E09-T04 | Compare with buddy | S | E09-T03 |
| E09-T05 | Progress overview page | M | E09-T02, E09-T03 |
| E09-T06 | Filters by tag / muscle group | S | E09-T05 |

## [E10 · Quality, Privacy & Launch](epics/E10-quality-launch.md)
_Milestone: M4 · Launch_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E10-T01 | End-to-end happy path suite | M | E09-T03 |
| E10-T02 | Accessibility audit | S | E10-T01 |
| E10-T03 | Performance pass | S | E10-T01 |
| E10-T04 | Security review | S | E10-T01 |
| E10-T05 | Privacy & account deletion | M | E04-T03, E08-T01 |
| E10-T06 | Installable PWA shell | S | E02-T06 |
| E10-T07 | Launch checklist | S | E10-T02, E10-T03, E10-T04, E10-T05 |

## Totals

- Tasks: 64 (39 × S, 25 × M)
- Rough effort: ~89 developer-days (S = 1, M = 2)
