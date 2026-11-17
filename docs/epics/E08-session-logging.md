# E08 · Session Logging

**Goal:** Inside a session, participants add exercises and log weight, reps and notes for every person, with each person's last attempt loaded automatically.
**Milestone:** M2 · Train together
**Depends on:** E06, E07

---

### E08-T01 · Logging schema & RLS — `M`
**Why:** Sets and notes are the core data of the app; they must be correct, private to session members, and record who entered them.

**Scope**
- Migrations for `session_exercises`, `session_sets`, `session_exercise_notes` (see [data-model.md](../data-model.md)).
- `session_sets.session_id` and `session_exercise_notes.session_id` filled by trigger from `session_exercise_id` (used by RLS and realtime filters).
- `set_number` assigned automatically per `(session_exercise_id, user_id)`; renumbered when a set is deleted.
- `recorded_by` / `updated_by` always set from `uid()` by trigger (client values ignored).
- Unique `(session_id, exercise_id)` in `session_exercises`.
- RLS: read for session members; write for session members when `is_session_editable(session)`; `user_id` of a set/note must be an accepted participant of that session.
- Indexes for last-attempt and progress queries: `session_sets (user_id, session_exercise_id)`, `session_exercises (exercise_id, session_id)`.

**Out of scope:** UI.

**Acceptance criteria**
- [ ] RLS tests: non-members cannot read or write; members can write for any accepted participant (D2).
- [ ] Logging a set for someone who isn't an accepted participant fails.
- [ ] A client sending `recorded_by = someone else` still gets `recorded_by = uid()`.
- [ ] Deleting set 2 of 3 renumbers the remaining sets to 1 and 2.
- [ ] Writes to cancelled or locked sessions fail.
- [ ] Weight < 0, reps < 1 or reps > 999 are rejected by check constraints.

**Depends on:** E07-T01, E06-T01

### E08-T02 · Add exercise to session — `S`
**Why:** A session is a list of exercises; adding one must be quick and lead straight into logging.

**Scope**
- **Add exercise** button (sticky at the bottom of the session page) opens the ExercisePicker (E06-T03) including "Create new".
- The selected exercise becomes a new card at the end, opened for logging; the page scrolls to it.
- Card menu: **Move up/down** (mobile), drag handle (desktop), **Remove** (confirmation if any sets exist; deletes its sets and notes).
- Choosing an exercise that is already in the session scrolls to and opens the existing card.

**Out of scope:** Supersets / grouping.

**Acceptance criteria**
- [ ] Adding an exercise takes at most 3 taps when it's in "Recently used".
- [ ] The same exercise can't appear twice in a session; choosing it again opens the existing card.
- [ ] Reordering persists after reload for all participants.
- [ ] Removing a card with sets asks for confirmation and removes the sets for everyone.
- [ ] Not available on locked/cancelled sessions.

**Depends on:** E08-T01, E06-T03

### E08-T03 · Last attempt RPC — `S`
**Why:** Seeing what you lifted last time is the main reason people track workouts; the query must be fast and follow decision D6.

**Scope**
- `last_attempt(exercise uuid, users text[], exclude_session uuid)` returning, per user: `session_id`, `session_date`, list of sets (`set_number`, `weight_kg`, `reps`), and `note`.
- "Last" = most recent session (by `started_at`, fallback `scheduled_at`) other than `exclude_session` in which that user has at least one set for the exercise. Cancelled sessions are ignored.
- One call returns data for all participants (avoids N requests).
- Only returns data for users the caller can see (session co-participants), via security-definer checks.

**Out of scope:** "Best ever" attempt (E09).

**Acceptance criteria**
- [ ] Returns an empty entry for a user who has never done the exercise.
- [ ] Ignores the current session, cancelled sessions, and sessions where the user has no sets for the exercise.
- [ ] Returns data for all requested participants in one call.
- [ ] A caller cannot get last attempts of users who aren't in the session with them.
- [ ] Responds in under 50 ms for a user with 2 years of data (index check in PR).

**Depends on:** E08-T01

### E08-T04 · Exercise card with per-participant logging — `M`
**Why:** This is where users spend most of their time in the gym; logging sets for each person must be fast, clear and one-handed.

**Scope**
- Exercise card (expanded): name; **participant switcher** (avatar + name chips; defaults to the current user). Machine, tags and card actions (move, remove, note, Copy all) are in the card's "⋯" menu, not on the main view.
- **Desktop (≥ 1024 px):** instead of the switcher, all participants' columns are shown side by side (last time, sets, kg/reps inputs and add button per person), with the session's exercise list on the left.
- For the selected participant:
  - Set list: `#`, weight, reps; tap a set to edit inline; swipe or menu to delete.
  - **Add set** row: weight and reps NumberSteppers + **✓ Add** button.
- Collapsed card: a single line with the exercise name and **your own** result, e.g. "Bench press · 4 × 8 · 82.5 kg" ("Not started" when you have no sets). Not a total set count across participants. Other participants' summaries appear when the card is expanded and their chip is selected.
- Only one card expanded at a time; expanding scrolls it into view.
- Optimistic updates (TanStack Query) with rollback and a toast on error.
- Haptic feedback on add (where supported).

**Out of scope:** Last-attempt pre-fill (E08-T05), notes (E08-T06), realtime (E08-T07).

**Acceptance criteria**
- [ ] Logging a set when values are pre-filled takes 1 tap (**Add**); changing weight and adding takes ≤ 3 taps.
- [ ] Switching participant shows that person's sets and inputs without reloading.
- [ ] Editing and deleting a set work and are kept after reload.
- [ ] A failed save shows the set as failed with **Retry**, and nothing is lost.
- [ ] Usable one-handed on a 360 px phone: Add button and steppers in the lower half of the screen.
- [ ] The collapsed summary shows the current user's result correctly (unit test of summary formatter, both locales).
- [ ] On desktop, every accepted participant has a logging column and sets can be added in any column without switching.

**Depends on:** E08-T02, E02-T05

### E08-T05 · Auto-load last attempt — `M`
**Why:** Pre-filling last time's numbers saves typing and shows the target to beat — a key requirement.

**Scope**
- When an exercise card is opened, fetch `last_attempt` for all accepted participants in one request (prefetched when the card is added or the session loads).
- Show one muted reference line for the selected participant: "Last time 60×8 · 60×8 · 57,5×7" (date and last note in the line's details/tooltip).
- Pre-fill the **Add set** inputs:
  - Set N → last attempt's set N.
  - After last attempt's set count, or if no last attempt: repeat the participant's previous set in this session.
  - No history at all: weight empty, reps 10 (placeholder).
- **Copy all** in the card's "⋯" menu: logs all last-attempt sets at once as new sets (editable afterwards).
- Clear visual difference between reference values (muted, italic label "Last time") and logged values.
- Link on the reference block to that previous session's summary.

**Out of scope:** Progression suggestions (e.g. "+2.5 kg").

**Acceptance criteria**
- [ ] Opening an exercise shows each participant's last attempt and the inputs pre-filled within 300 ms (data prefetched).
- [ ] For set 2, inputs show last time's set 2; for set 4 when last time had 3 sets, inputs repeat this session's set 3.
- [ ] A participant who never did the exercise sees "First time" and empty weight.
- [ ] **Copy all** creates the same number of sets with the same values, and they can be edited.
- [ ] Reference values can never be mistaken for logged sets (design review in both themes).

**Depends on:** E08-T03, E08-T04

### E08-T06 · Notes per participant per exercise — `S`
**Why:** Lifters note things like seat height, grip or pain; notes per person per exercise help next time.

**Scope**
- Notes field (Textarea) opened from **Add note** in the card's "⋯" menu, for the selected participant; once a note exists it shows as one muted line under the sets.
- Autosave 800 ms after typing stops, plus on blur; status "Saving…" / "Saved".
- Max 1000 characters with counter after 800.
- Last attempt's note shown in the reference block ("Last note: seat 4").
- Anyone in the session can edit any participant's note (D2); `updated_by` shown as a small avatar if not the participant.

**Out of scope:** Session-level notes; rich text.

**Acceptance criteria**
- [ ] Typing a note and leaving the page without clicking anything still saves it.
- [ ] The 1001st character is not accepted and the counter warns from 800.
- [ ] Last time's note is visible when logging the same exercise in the next session.
- [ ] Concurrent edits: the last save wins and the other user sees the update (after E08-T07).

**Depends on:** E08-T01, E08-T04

### E08-T07 · Realtime sync between participants — `M`
**Why:** Buddies often log on their own phones; everyone should see the same session without refreshing.

**Scope**
- Supabase Realtime channel per session (`session:{id}`) listening to inserts/updates/deletes on `session_exercises`, `session_sets`, `session_exercise_notes`, `session_participants` and the session row, filtered by `session_id`.
- Merge events into the TanStack Query cache; ignore echoes of the user's own optimistic changes (match by client-generated id).
- Show a small avatar on sets recorded by someone else.
- Presence: avatars of participants currently viewing the session.
- Reconnect handling: on reconnect or tab focus, refetch the session.
- Connection indicator only when offline ("Offline – changes will sync").

**Out of scope:** Full offline mode with a queue (post-MVP).

**Acceptance criteria**
- [ ] A set logged on phone A appears on phone B within 2 seconds.
- [ ] No duplicate sets appear on the phone that logged them.
- [ ] Exercise reorders, new exercises and status changes (e.g. completed) also sync.
- [ ] After turning flight mode on and off, the session refreshes and shows all changes.
- [ ] Users who aren't members receive no events (RLS on realtime verified).
- [ ] e2e test with two browser contexts.

**Depends on:** E08-T04

### E08-T08 · Personal record highlight — `S`
**Why:** A small celebration of a new best motivates users, without making the UI loud.

**Scope**
- When a set is logged, compare it to the participant's previous best for that exercise (from sessions before this one): **weight PR** (heaviest weight at ≥ 1 rep) and **e1RM PR** (Epley).
- Show a small muted-ochre "PR" chip on the set and a short toast "New personal record: 62,5 kg".
- Uses the shared metrics library (E09-T01); previous bests prefetched with the last attempt.
- First-ever attempt is not a PR.

**Out of scope:** PR history page (part of E09-T03).

**Acceptance criteria**
- [ ] Logging a heavier weight than ever before shows the PR chip and toast once.
- [ ] Editing the set down below the record removes the chip.
- [ ] Bodyweight (0 kg) exercises use reps PR instead of weight.
- [ ] Results match E09 dashboards for the same data (shared tests).
- [ ] No bright colors or large animations (design review).

**Depends on:** E08-T04, E09-T01
