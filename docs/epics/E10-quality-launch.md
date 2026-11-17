# E10 · Quality, Privacy & Launch

**Goal:** The MVP is accessible, fast, private and observable before public launch.
**Milestone:** M4 · Launch
**Depends on:** E01–E09

---

### E10-T01 · End-to-end happy path suite — `M`
**Why:** The full shared-workout flow touches every epic; one automated run proves it all works together before each release.

**Scope**
- Playwright scenarios with two test users (A and B) in separate browser contexts:
  1. A and B sign in (testing tokens).
  2. A finds B and sends a buddy request; B accepts.
  3. A creates a session and invites B; B accepts.
  4. A adds an existing exercise; B creates a new exercise from the picker.
  5. A logs sets for A and B; B logs a set and a note on their own phone; both see each other's changes.
  6. A completes the session; both view the session summary.
  7. Second session: last attempt is pre-filled; A logs a heavier set → PR chip.
  8. A opens the exercise progress dashboard and sees two data points.
- Smoke run of key pages in `lt` + dark and `en` + light.
- Mobile viewport (iPhone) and desktop.

**Out of scope:** Load testing.

**Acceptance criteria**
- [ ] All scenarios pass in CI on every PR to `main`.
- [ ] 20 consecutive CI runs pass without retries (no flaky tests).
- [ ] Failure output includes screenshot, trace and the step that failed.
- [ ] Suite runs in under 6 minutes.

**Depends on:** E09-T03

### E10-T02 · Accessibility audit — `S`
**Why:** The app must be usable by everyone, including keyboard and screen-reader users, in both themes.

**Scope**
- `@axe-core/playwright` checks on: landing, Home, Buddies, Sessions, session logging, exercise form, all dashboards — in both themes.
- Manual checks: VoiceOver on iOS (log a set end-to-end), keyboard-only on desktop, 200% zoom, `prefers-reduced-motion`.
- Contrast re-check of final colors, including charts and calendar.
- Fix issues or create follow-up tasks with severity.

**Out of scope:** Formal certification.

**Acceptance criteria**
- [ ] Zero critical or serious axe violations on the listed pages in both themes.
- [ ] A set can be logged end-to-end with VoiceOver and with keyboard only.
- [ ] Layout works at 200% zoom without lost content.
- [ ] All findings fixed or ticketed with an owner.

**Depends on:** E10-T01

### E10-T03 · Performance pass — `S`
**Why:** The app is used on phones in gyms with weak signal; it must feel instant.

**Scope**
- Lighthouse (mobile, throttled 4G) for landing, Home, session logging and Progress overview.
- Bundle analysis (`@next/bundle-analyzer`); lazy-load charts and heavy pickers.
- `EXPLAIN ANALYZE` for all RPCs on the demo dataset scaled ×10; add missing indexes.
- Measure set-logging round-trip time (p95) on the Coolify preview/staging deployment; check server CPU/memory under a small load test (e.g. 20 concurrent users) and set container resource limits in Coolify.
- Make sure static assets (`/_next/static`) are served with long-lived cache headers.

**Out of scope:** Adding a CDN or more servers (only if measurements show it's needed).

**Acceptance criteria**
- [ ] LCP < 2.5 s and Lighthouse performance ≥ 90 on the four pages.
- [ ] Set logging round-trip p95 < 300 ms.
- [ ] No RPC over 150 ms on the scaled dataset.
- [ ] First-load JS for the session page under 200 kB (gzipped).
- [ ] Server stays below 70% CPU and memory during the load test, with resource limits set.

**Depends on:** E10-T01

### E10-T04 · Security review — `S`
**Why:** The app stores personal training data and shares it between users; a final review confirms the protections hold.

**Scope**
- Checklist review of RLS for every table and operation (select/insert/update/delete) against the data-model doc; fill any test gaps.
- Confirm the service-role key is only used in the webhook/admin module.
- Webhook signature verification and replay handling.
- Rate limits on `search_users`, exercise/machine creation and buddy requests (e.g. Upstash or Postgres-based counter).
- Security headers (CSP, HSTS, frame-ancestors), dependency audit (`npm audit`, Dependabot), Docker base image scan (e.g. Trivy).
- Self-hosted server: Coolify and OS up to date, SSH key-only, firewall (22/80/443 only), Coolify dashboard behind strong auth/2FA, no unused open ports.
- Check that no private data (emails, notes) appears in logs or error tracking.

**Out of scope:** External penetration test.

**Acceptance criteria**
- [ ] Every table has RLS tests for all four operations.
- [ ] Rate limits return a translated "Too many requests" after the threshold.
- [ ] Security headers score A on securityheaders.com (or equivalent check).
- [ ] No high or critical vulnerabilities open in dependencies or the Docker image.
- [ ] Server hardening checklist completed (port scan shows only 22/80/443).
- [ ] Review notes stored in `docs/security-review.md`.

**Depends on:** E10-T01

### E10-T05 · Privacy & account deletion — `M`
**Why:** EU users (GDPR) have the right to see and delete their data; it's also simply expected.

**Scope**
- Privacy policy page (EN/LT): what is stored, who can see it (buddies, session co-participants), retention, contact.
- **Export my data** (Settings): JSON download of profile, buddies (names only), sessions, exercises created, sets and notes.
- **Delete account** (Settings): confirmation by typing a word; deletes the Clerk user, which triggers `user.deleted`:
  - Delete profile, buddy connections, participations, own sets and notes.
  - Sessions owned by the user: ownership moves to another accepted participant, or the session is deleted if none.
  - Exercises/machines created by the user are kept with `created_by = null`.
- Data retention note in docs.

**Out of scope:** Data import.

**Acceptance criteria**
- [ ] Export contains all of the user's sessions, sets and notes, and opens as valid JSON.
- [ ] After deletion, no row in any table references the user id (automated test).
- [ ] Buddies still see their own sets in shared sessions; the deleted user appears as "Deleted user".
- [ ] Deletion completes within 1 minute.
- [ ] Privacy policy is linked from the landing page and Settings in both languages.

**Depends on:** E04-T03, E08-T01

### E10-T06 · Installable PWA shell — `S`
**Why:** Opening the app from the home screen like a native app makes it faster to use in the gym.

**Scope**
- Web app manifest (name, short name, icons in earth tones, `display: standalone`, start URL `/`).
- Apple touch icons and splash screens; `theme-color` per mode.
- Minimal service worker caching static assets (no offline data sync).
- Gentle "Add to Home Screen" hint after the second completed session (dismissible, not shown again).

**Out of scope:** Offline logging, push notifications.

**Acceptance criteria**
- [ ] Installable on Android Chrome (install prompt) and iOS Safari (Add to Home Screen).
- [ ] Opens full-screen with the correct icon and theme color.
- [ ] Lighthouse PWA "installable" check passes.
- [ ] The hint appears at most once and can be dismissed.

**Depends on:** E02-T06

### E10-T07 · Launch checklist — `S`
**Why:** A short, explicit checklist prevents forgotten production settings on launch day.

**Scope**
- Production Clerk instance with verified Google OAuth consent screen (app name, logo, privacy policy URL).
- Custom domain pointed to the Coolify server; HTTPS certificate issued by Coolify's proxy; Clerk (production instance) and Supabase configured for the domain.
- Supabase production: point-in-time recovery/backups enabled, seed data loaded, connection limits checked.
- Error tracking alerts (new error types, error spikes) to the team channel; external uptime check on `/api/health`.
- Coolify: backup of its own configuration/database enabled, server disk-usage alerts, old Docker images cleaned up automatically.
- Analytics (privacy-friendly) for the success metrics in the vision doc.
- Smoke test on production with a real Google account.

**Out of scope:** Marketing activities.

**Acceptance criteria**
- [ ] Every checklist item is checked off with a link or screenshot as evidence.
- [ ] A real Google account can sign in on production and complete the happy path.
- [ ] A restore from backup has been tested once on staging.
- [ ] The product owner signs off the launch.

**Depends on:** E10-T02, E10-T03, E10-T04, E10-T05
