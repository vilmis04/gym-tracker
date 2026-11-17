# E07 · Gym Sessions

**Goal:** Users create gym sessions, invite gym buddies, and move sessions through planned → active → completed.
**Milestone:** M2 · Train together
**Depends on:** E05

---

### E07-T01 · Session schema, RLS & lifecycle — `M`
**Why:** Sessions define who can see and log which data, so the rules for membership, invites and status must be enforced in the database.

**Scope**
- Migrations for `gym_sessions` and `session_participants` (see [data-model.md](../data-model.md#gym_sessions)); `invite_status` adds `removed` and `left` (Q4).
- Trigger: on session insert, add the owner as participant with role `owner`, `invite_status = accepted`.
- `is_session_member(session, user)` — accepted participant (`security definer`, `stable`).
- Status transitions enforced by a trigger: `planned → active | cancelled`, `active → completed | cancelled`, `completed → active` (reopen, only within the edit window). `started_at`/`completed_at` set automatically.
- RLS:
  - Sessions: SELECT for members and invited users; INSERT with `owner_id = uid()`; UPDATE of details by owner; status change by any member.
  - Participants: SELECT for members/invitees of that session; INSERT (invite) only by owner, only for buddies (`are_buddies`); invitee updates own `invite_status` (`invited → accepted | declined`, `accepted → left`); owner can set `removed`.
- Extend `profiles` SELECT policy to co-participants.

**Out of scope:** UI; edit lock (E07-T06).

**Acceptance criteria**
- [ ] Creating a session adds the owner as an accepted participant automatically.
- [ ] Inviting a user who is not the owner's buddy fails (RLS test).
- [ ] A non-member cannot see the session or its participant list.
- [ ] Invalid transitions (e.g. `completed → planned`, `cancelled → active`) are rejected with a clear error.
- [ ] Only the invitee can accept/decline their invitation; only the owner can remove a participant.
- [ ] `started_at` and `completed_at` are filled in when status changes.

**Depends on:** E05-T01

### E07-T02 · Create session — `M`
**Why:** Starting a workout should take seconds, whether planning ahead or starting right now with friends.

**Scope**
- "New session" from Home and Sessions page (and "Start session with…" on a buddy).
- Form: **When** (date/time, default now), **Who's coming** (buddies as toggle chips; a search field appears when there are more than ~8 buddies), and a collapsed **Add title or location** row revealing **Title** (optional; placeholder shows the generated default) and **Location** (optional, free text with last used locations as suggestions).
- Two submit buttons at the bottom: **Start now** (primary, status `active`) and **Plan for later** (text button, status `planned`; if the time is still "now" it opens the time picker first).
- Default title by locale and weekday: "Antradienio treniruotė" / "Tuesday session".
- Warn (not block) if the user already has an active session: "You have an active session. Continue it instead?"

**Out of scope:** Recurring sessions, templates.

**Acceptance criteria**
- [ ] A solo session can be started with one tap after opening the form (all defaults).
- [ ] Invited buddies see the invitation in their Invitations tab.
- [ ] Only buddies appear in the invite picker.
- [ ] **Plan for later** with a past time shows a validation error; **Start now** always works.
- [ ] After saving, the user lands on the session page.
- [ ] The default title is in the active language and matches the weekday.

**Depends on:** E07-T01, E02-T04

### E07-T03 · Sessions list — `S`
**Why:** Users need a quick overview of the current session, what's coming and what they've done.

**Scope**
- Sessions page with tabs:
  - **Upcoming:** active session pinned on top with **Continue**, then planned sessions ascending by time.
  - **Invitations:** pending invites with **Accept** / **Decline** (E07-T04).
  - **History:** completed sessions, newest first, paginated (20 per page); cancelled sessions shown muted with a "Cancelled" label.
- Session row (plain list, not cards): day/date, title, one muted line (time · who's coming, or exercises for history), and one trailing label when relevant (**Continue**, **Respond**, PR count, "Cancelled").
- Pending invitation count in the tab label ("Invitations · 2"); no badge on the nav item.
- **New session** is a round + button in the page header.

**Out of scope:** Calendar view (part of E09-T05).

**Acceptance criteria**
- [ ] An active session always appears first in Upcoming with a working **Continue** button.
- [ ] Each tab has a translated empty state with a relevant action.
- [ ] History loads more items on scroll without duplicates.
- [ ] The count in the Invitations tab label matches the list and the count on Home.

**Depends on:** E07-T01

### E07-T04 · Respond to invitations — `S`
**Why:** Invited buddies decide whether to join; once they join they can log in the session.

**Scope**
- Accept / Decline on the Invitations tab and on the session page (an invited user sees a read-only preview with a banner: "Jonas invited you. Join?").
- **Leave session** for accepted participants (not the owner), with confirmation.
- The owner sees each participant's status (invited / accepted / declined / left).

**Out of scope:** Notifications outside the app.

**Acceptance criteria**
- [ ] After accepting, the session appears in the user's Upcoming tab and they can log sets in it.
- [ ] After declining, the invitation disappears for the invitee and the owner sees "Declined".
- [ ] A participant who leaves can no longer see the session; their already logged sets stay in their own history.
- [ ] The owner cannot leave their own session (can cancel it instead).

**Depends on:** E07-T01

### E07-T05 · Session detail & management — `M`
**Why:** The session page is the hub of a workout: who's there, its state, and the actions to start, finish or change it.

**Scope**
- Session page header: title, status with elapsed time ("Active · 42 min"), and a "⋯" menu with the actions (participants and location live in the menu/details view on mobile; desktop shows "with Jonas and Ona" under the title and a **Complete session** button).
- Owner actions: edit details, invite more buddies, remove a participant, cancel session.
- Any participant: **Start** (planned → active), **Complete** (active → completed, with confirmation and short summary "5 exercises · 42 sets"), **Reopen** (within edit window).
- Below the header: the exercise list / logging area (E08).
- After **Complete**, navigate to the session summary (E09-T02).
- Cancelled sessions are read-only with a banner.

**Out of scope:** Logging UI (E08).

**Acceptance criteria**
- [ ] Only the owner sees edit, invite, remove and cancel actions.
- [ ] Removing a participant revokes their access; their already logged sets are kept and still count in their own history (see [open-questions.md](../open-questions.md) Q4).
- [ ] Completing shows a confirmation and then the session summary.
- [ ] Cancelled sessions show a banner and no edit controls.
- [ ] Participants see status changes from others after a refresh (live updates come in E08-T07).

**Depends on:** E07-T01

### E07-T06 · Edit lock after completion — `S`
**Why:** Training history should be trustworthy; users can fix typos for a while, but old sessions shouldn't change (decision D7).

**Scope**
- SQL function `is_session_editable(session)`: status not `cancelled`, and if `completed`, `completed_at > now() - interval '7 days'`.
- Used in RLS write policies for `session_exercises`, `session_sets`, `session_exercise_notes` and for session reopen.
- Server Actions return `LOCKED` error code → translated "This session is locked for editing".
- UI hides edit controls and shows "Locked · completed {date}" on locked sessions.

**Out of scope:** Admin override.

**Acceptance criteria**
- [ ] Sets can be added/edited 6 days after completion and are rejected 8 days after (DB test with mocked time).
- [ ] A locked session shows no edit controls in the UI.
- [ ] Trying to write through the API returns the `LOCKED` error and the translated message.
- [ ] Reopen is not offered for locked sessions.

**Depends on:** E07-T01

### E07-T07 · Home screen — `S`
**Why:** Home should get users into their workout in one tap and show what needs attention.

**Scope**
- Home sections (only shown if relevant), kept short on purpose:
  1. **Active session** card with **Continue**; when there is none, a primary **Start session** button takes its place.
  2. **Up next**: the next planned session with time and who's coming.
  3. One row with the pending count ("2 session invitations", including buddy requests) linking to the right place.
- Recent sessions are not on mobile Home; they are in Sessions › History. Desktop Home adds month stats, the activity heatmap and the week agenda (E09-T05).
- New-user empty state: 3 steps — "Add a gym buddy", "Start your first session", "Log your first set".

**Out of scope:** Progress tiles (E09-T05).

**Acceptance criteria**
- [ ] With an active session, Continue is the most visible element and opens the session page.
- [ ] A brand-new user sees the onboarding steps, and each opens the right screen.
- [ ] Home loads in under 1 second on 4G (server-rendered, one query per section or fewer).
- [ ] All counts match the corresponding pages.

**Depends on:** E07-T03
