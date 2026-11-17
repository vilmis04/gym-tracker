# E10 · Quality, Privacy & Launch

**Goal:** The MVP is accessible, fast, private and observable before public launch.
**Milestone:** M4 · Launch
**Depends on:** E01–E09

---

### E10-T01 · End-to-end happy path suite — `M`
Playwright scenarios: sign in → add buddy → buddy accepts → create session with invite → accept → add exercise (create new) → log sets for both → complete → view session and exercise dashboards. Run in both locales and themes (smoke).

**Acceptance criteria**
- [ ] Suite runs in CI on every PR to `main` and is stable (no flaky retries needed over 20 runs)

**Depends on:** E09-T03

### E10-T02 · Accessibility audit — `S`
axe checks in e2e for key pages, manual screen-reader pass (VoiceOver iOS), keyboard-only pass, contrast re-check in both themes.

**Acceptance criteria**
- [ ] Zero critical/serious axe violations
- [ ] Issues found are fixed or ticketed

**Depends on:** E10-T01

### E10-T03 · Performance pass — `S`
Lighthouse on mobile for Home, Session logging, Progress; bundle analysis; DB index review via `EXPLAIN` on RPCs.

**Acceptance criteria**
- [ ] Meets NFR targets in [architecture.md](../architecture.md#non-functional-requirements)

**Depends on:** E10-T01

### E10-T04 · Security review — `S`
Review RLS on all tables, service-role key usage, webhook verification, rate limiting on search and create endpoints, dependency audit.

**Acceptance criteria**
- [ ] RLS test coverage for every table and operation
- [ ] No high/critical vulnerabilities open

**Depends on:** E10-T01

### E10-T05 · Privacy & account deletion — `M`
Privacy policy page (EN/LT), data export (JSON of own sessions/sets), account deletion: remove profile and personal data; sets in shared sessions are deleted for the user; user-created catalog entries are kept with `created_by = null`.

**Acceptance criteria**
- [ ] Deletion is complete within 1 minute and verified by test
- [ ] Export contains all of the user's sessions, sets and notes

**Depends on:** E04-T03, E08-T01

### E10-T06 · Installable PWA shell — `S`
Web app manifest, icons (earth-tone), theme-color per mode, "Add to Home Screen" support. (Offline sync is out of MVP.)

**Acceptance criteria**
- [ ] Installable on Android Chrome and iOS Safari; opens full-screen

**Depends on:** E02-T06

### E10-T07 · Launch checklist — `S`
Production Clerk instance + Google OAuth consent screen verified, custom domain, backups enabled in Supabase, error alerting, analytics, seed data in production.

**Acceptance criteria**
- [ ] Checklist completed and signed off by product owner

**Depends on:** E10-T02, E10-T03, E10-T04, E10-T05
