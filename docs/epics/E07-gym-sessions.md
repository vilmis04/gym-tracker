# E07 · Gym Sessions

**Goal:** Users create gym sessions, invite gym buddies, and move sessions through planned → active → completed.
**Milestone:** M2 · Train together
**Depends on:** E05

---

### E07-T01 · Session schema, RLS & lifecycle — `M`
Migrations for `gym_sessions` and `session_participants`, `is_session_member()` helper, RLS (members + invitees read; owner manages; invite only buddies), status transitions enforced in a DB function/trigger.

**Acceptance criteria**
- [ ] Owner auto-added as `accepted` participant
- [ ] Inviting a non-buddy fails (RLS/constraint test)
- [ ] Invalid transitions (e.g. completed → planned) rejected

**Depends on:** E05-T01

### E07-T02 · Create session — `M`
"New session" flow: date/time (default now), optional title and location, invite buddies (multi-select Combobox from buddy list). "Start now" option creates the session directly as `active`.

**Acceptance criteria**
- [ ] Session can be created with zero invitees (solo)
- [ ] After creation the user lands on the session page
- [ ] Default title generated per locale ("Antradienio treniruotė" / "Tuesday session")

**Depends on:** E07-T01, E02-T04

### E07-T03 · Sessions list — `S`
Sessions page with tabs: **Upcoming** (planned + active), **Invitations**, **History** (completed). Card shows date, title, participant avatars, status.

**Acceptance criteria**
- [ ] Active session pinned at top with "Continue" button
- [ ] History paginated, newest first

**Depends on:** E07-T01

### E07-T04 · Respond to invitations — `S`
Accept / decline an invitation from the Invitations tab or from the session page. Participant can leave a session later.

**Acceptance criteria**
- [ ] Accepted participant sees the session in Upcoming and can log in it
- [ ] Declined invitations disappear from the invitee's list; owner sees status

**Depends on:** E07-T01

### E07-T05 · Session detail & management — `M`
Session page header: title, date, status, participants with invite status. Owner can edit details, invite more buddies, remove participants, start, complete, or cancel. Any participant can start/complete.

**Acceptance criteria**
- [ ] Removing a participant revokes their access; their already logged sets are kept and still count in their own history (see [open-questions.md](../open-questions.md) Q4)
- [ ] Complete shows a confirmation and then the session summary (E09-T02)
- [ ] Cancelled sessions are read-only

**Depends on:** E07-T01

### E07-T06 · Edit lock after completion — `S`
Implement D7: completed sessions editable for 7 days, then read-only (enforced in RLS via `completed_at`).

**Acceptance criteria**
- [ ] Writes after the window fail with a translated "Session is locked" error
- [ ] UI hides edit controls on locked sessions

**Depends on:** E07-T01

### E07-T07 · Home screen — `S`
Home shows: active session (Continue), next planned session, pending invitations count, last 3 completed sessions, quick "Start session" button.

**Acceptance criteria**
- [ ] One-tap path from Home to logging an active session
- [ ] Friendly empty state for new users (add a buddy / start first session)

**Depends on:** E07-T03
