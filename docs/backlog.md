# Backlog

Summary of all tasks. Each task links to its full description, scope and acceptance criteria in the epic file. Sizes: **S** ≤ 1 day, **M** 1–3 days. The [Definition of Done](roadmap.md#definition-of-done) applies to every task.

**Totals:** 65 tasks (39 × S, 26 × M), roughly 91 developer-days (S = 1, M = 2).

## [E01 · Project Foundation](epics/E01-foundation.md)
_Milestone: M1 · Walking skeleton_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E01-T01 | [Bootstrap Next.js app](epics/E01-foundation.md#e01-t01--bootstrap-nextjs-app--s) | S | — |
| E01-T02 | [Supabase local setup & migrations workflow](epics/E01-foundation.md#e01-t02--supabase-local-setup--migrations-workflow--s) | S | E01-T01 |
| E01-T03 | [Supabase client helpers](epics/E01-foundation.md#e01-t03--supabase-client-helpers--s) | S | E01-T02 (token wiring finalized in E04-T02) |
| E01-T04 | [Testing setup](epics/E01-foundation.md#e01-t04--testing-setup--m) | M | E01-T02 |
| E01-T05 | [CI pipeline](epics/E01-foundation.md#e01-t05--ci-pipeline--s) | S | E01-T04 |
| E01-T06 | [Docker image for self-hosting](epics/E01-foundation.md#e01-t06--docker-image-for-self-hosting--s) | S | E01-T01 |
| E01-T07 | [Error tracking & shared Result type](epics/E01-foundation.md#e01-t07--error-tracking--shared-result-type--s) | S | E01-T01 |
| E01-T08 | [Coolify environments & deployment pipeline](epics/E01-foundation.md#e01-t08--coolify-environments--deployment-pipeline--m) | M | E01-T05, E01-T06 |

## [E02 · Design System & Theming](epics/E02-design-system.md)
_Milestone: M1 · Walking skeleton_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E02-T01 | [Design tokens & Tailwind theme](epics/E02-design-system.md#e02-t01--design-tokens--tailwind-theme--m) | M | E01-T01 |
| E02-T02 | [Light / dark mode](epics/E02-design-system.md#e02-t02--light--dark-mode--s) | S | E02-T01 |
| E02-T03 | [Base UI components](epics/E02-design-system.md#e02-t03--base-ui-components--m) | M | E02-T01 |
| E02-T04 | [Searchable Combobox component](epics/E02-design-system.md#e02-t04--searchable-combobox-component--m) | M | E02-T03 |
| E02-T05 | [NumberStepper component](epics/E02-design-system.md#e02-t05--numberstepper-component--s) | S | E02-T03 |
| E02-T06 | [App layout & navigation](epics/E02-design-system.md#e02-t06--app-layout--navigation--m) | M | E02-T03, E03-T01 |

## [E03 · Internationalization (EN / LT)](epics/E03-i18n.md)
_Milestone: M1 · Walking skeleton_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E03-T01 | [next-intl setup & locale routing](epics/E03-i18n.md#e03-t01--next-intl-setup--locale-routing--m) | M | E01-T01 |
| E03-T02 | [Language switcher & persistence](epics/E03-i18n.md#e03-t02--language-switcher--persistence--s) | S | E03-T01, E04-T04 |
| E03-T03 | [Formatting helpers](epics/E03-i18n.md#e03-t03--formatting-helpers--s) | S | E03-T01 |
| E03-T04 | [Missing-key check in CI](epics/E03-i18n.md#e03-t04--missing-key-check-in-ci--s) | S | E03-T01, E01-T05 |
| E03-T05 | [Translated catalog content](epics/E03-i18n.md#e03-t05--translated-catalog-content--s) | S | E06-T01 |

## [E04 · Authentication & Profile](epics/E04-auth.md)
_Milestone: M1 · Walking skeleton_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E04-T01 | [Clerk with Google sign-in](epics/E04-auth.md#e04-t01--clerk-with-google-sign-in--s) | S | E01-T01, E03-T01 |
| E04-T02 | [Clerk ↔ Supabase integration](epics/E04-auth.md#e04-t02--clerk--supabase-integration--s) | S | E04-T01, E01-T03 |
| E04-T03 | [Profiles table & sync](epics/E04-auth.md#e04-t03--profiles-table--sync--m) | M | E04-T02 |
| E04-T04 | [Settings page](epics/E04-auth.md#e04-t04--settings-page--s) | S | E04-T03, E02-T02 |
| E04-T05 | [Public landing page](epics/E04-auth.md#e04-t05--public-landing-page--s) | S | E04-T01, E02-T03 |

## [E05 · Gym Buddies](epics/E05-gym-buddies.md)
_Milestone: M2 · Train together_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E05-T01 | [Buddy schema, RLS & helpers](epics/E05-gym-buddies.md#e05-t01--buddy-schema-rls--helpers--m) | M | E04-T03 |
| E05-T02 | [Find users & send request](epics/E05-gym-buddies.md#e05-t02--find-users--send-request--m) | M | E05-T01, E02-T04 |
| E05-T03 | [Incoming / outgoing requests](epics/E05-gym-buddies.md#e05-t03--incoming--outgoing-requests--s) | S | E05-T01 |
| E05-T04 | [Buddy list](epics/E05-gym-buddies.md#e05-t04--buddy-list--s) | S | E05-T01 |
| E05-T05 | [Invite link](epics/E05-gym-buddies.md#e05-t05--invite-link--s) | S | E05-T02 |
| E05-T06 | [In-app notifications for buddy events](epics/E05-gym-buddies.md#e05-t06--in-app-notifications-for-buddy-events--s) | S | E05-T03 |

## [E06 · Exercise Catalog](epics/E06-exercise-catalog.md)
_Milestone: M2 · Train together_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E06-T01 | [Catalog schema & seed](epics/E06-exercise-catalog.md#e06-t01--catalog-schema--seed--m) | M | E04-T03 |
| E06-T02 | [Exercise search RPC](epics/E06-exercise-catalog.md#e06-t02--exercise-search-rpc--s) | S | E06-T01 |
| E06-T03 | [Exercise picker (autocomplete)](epics/E06-exercise-catalog.md#e06-t03--exercise-picker-autocomplete--m) | M | E06-T02, E02-T04 |
| E06-T04 | [Create / edit exercise form](epics/E06-exercise-catalog.md#e06-t04--create--edit-exercise-form--m) | M | E06-T03, E06-T05 |
| E06-T05 | [Rule-based auto-tagging](epics/E06-exercise-catalog.md#e06-t05--rule-based-auto-tagging--s) | S | E06-T01 |
| E06-T06 | [Machine management](epics/E06-exercise-catalog.md#e06-t06--machine-management--s) | S | E06-T01, E02-T04 |
| E06-T07 | [Exercise library page](epics/E06-exercise-catalog.md#e06-t07--exercise-library-page--s) | S | E06-T02 |

## [E07 · Gym Sessions](epics/E07-gym-sessions.md)
_Milestone: M2 · Train together_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E07-T01 | [Session schema, RLS & lifecycle](epics/E07-gym-sessions.md#e07-t01--session-schema-rls--lifecycle--m) | M | E05-T01 |
| E07-T02 | [Create session](epics/E07-gym-sessions.md#e07-t02--create-session--m) | M | E07-T01, E02-T04 |
| E07-T03 | [Sessions list](epics/E07-gym-sessions.md#e07-t03--sessions-list--s) | S | E07-T01 |
| E07-T04 | [Respond to invitations](epics/E07-gym-sessions.md#e07-t04--respond-to-invitations--s) | S | E07-T01 |
| E07-T05 | [Session detail & management](epics/E07-gym-sessions.md#e07-t05--session-detail--management--m) | M | E07-T01 |
| E07-T06 | [Edit lock after completion](epics/E07-gym-sessions.md#e07-t06--edit-lock-after-completion--s) | S | E07-T01 |
| E07-T07 | [Home screen](epics/E07-gym-sessions.md#e07-t07--home-screen--s) | S | E07-T03 |

## [E08 · Session Logging](epics/E08-session-logging.md)
_Milestone: M2 · Train together_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E08-T01 | [Logging schema & RLS](epics/E08-session-logging.md#e08-t01--logging-schema--rls--m) | M | E07-T01, E06-T01 |
| E08-T02 | [Add exercise to session](epics/E08-session-logging.md#e08-t02--add-exercise-to-session--s) | S | E08-T01, E06-T03 |
| E08-T03 | [Last attempt RPC](epics/E08-session-logging.md#e08-t03--last-attempt-rpc--s) | S | E08-T01 |
| E08-T04 | [Exercise card with per-participant logging](epics/E08-session-logging.md#e08-t04--exercise-card-with-per-participant-logging--m) | M | E08-T02, E02-T05 |
| E08-T05 | [Auto-load last attempt](epics/E08-session-logging.md#e08-t05--auto-load-last-attempt--m) | M | E08-T03, E08-T04 |
| E08-T06 | [Notes per participant per exercise](epics/E08-session-logging.md#e08-t06--notes-per-participant-per-exercise--s) | S | E08-T01, E08-T04 |
| E08-T07 | [Realtime sync between participants](epics/E08-session-logging.md#e08-t07--realtime-sync-between-participants--m) | M | E08-T04 |
| E08-T08 | [Personal record highlight](epics/E08-session-logging.md#e08-t08--personal-record-highlight--s) | S | E08-T04, E09-T01 |

## [E09 · Progress Dashboards](epics/E09-progress-dashboards.md)
_Milestone: M3 · See progress_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E09-T01 | [Metrics library & RPCs](epics/E09-progress-dashboards.md#e09-t01--metrics-library--rpcs--m) | M | E08-T01 |
| E09-T02 | [Dashboard: user per session](epics/E09-progress-dashboards.md#e09-t02--dashboard-user-per-session--m) | M | E09-T01, E07-T05 |
| E09-T03 | [Dashboard: user per exercise](epics/E09-progress-dashboards.md#e09-t03--dashboard-user-per-exercise--m) | M | E09-T01 |
| E09-T04 | [Compare with buddy](epics/E09-progress-dashboards.md#e09-t04--compare-with-buddy--s) | S | E09-T03 |
| E09-T05 | [Progress overview page](epics/E09-progress-dashboards.md#e09-t05--progress-overview-page--m) | M | E09-T02, E09-T03 |
| E09-T06 | [Filters by tag / muscle group](epics/E09-progress-dashboards.md#e09-t06--filters-by-tag--muscle-group--s) | S | E09-T05 |

## [E10 · Quality, Privacy & Launch](epics/E10-quality-launch.md)
_Milestone: M4 · Launch_

| ID | Task | Size | Depends on |
|---|---|---|---|
| E10-T01 | [End-to-end happy path suite](epics/E10-quality-launch.md#e10-t01--end-to-end-happy-path-suite--m) | M | E09-T03 |
| E10-T02 | [Accessibility audit](epics/E10-quality-launch.md#e10-t02--accessibility-audit--s) | S | E10-T01 |
| E10-T03 | [Performance pass](epics/E10-quality-launch.md#e10-t03--performance-pass--s) | S | E10-T01 |
| E10-T04 | [Security review](epics/E10-quality-launch.md#e10-t04--security-review--s) | S | E10-T01 |
| E10-T05 | [Privacy & account deletion](epics/E10-quality-launch.md#e10-t05--privacy--account-deletion--m) | M | E04-T03, E08-T01 |
| E10-T06 | [Installable PWA shell](epics/E10-quality-launch.md#e10-t06--installable-pwa-shell--s) | S | E02-T06 |
| E10-T07 | [Launch checklist](epics/E10-quality-launch.md#e10-t07--launch-checklist--s) | S | E10-T02, E10-T03, E10-T04, E10-T05 |

When you add, rename or resize a task in an epic file, update its row here too.
