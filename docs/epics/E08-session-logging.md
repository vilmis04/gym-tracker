# E08 · Session Logging

**Goal:** Inside a session, participants add exercises and log weight, reps and notes for every person, with each person's last attempt loaded automatically.
**Milestone:** M2 · Train together
**Depends on:** E06, E07

---

### E08-T01 · Logging schema & RLS — `M`
Migrations for `session_exercises`, `session_sets`, `session_exercise_notes` (see [data-model.md](../data-model.md)). Members can write for any member of the same session; `recorded_by`/`updated_by` set from `uid()` by trigger. Respect cancelled/locked state.

**Acceptance criteria**
- [ ] Non-members cannot read or write (RLS tests)
- [ ] Logging a set for a user who isn't an accepted participant fails
- [ ] `recorded_by` cannot be spoofed

**Depends on:** E07-T01, E06-T01

### E08-T02 · Add exercise to session — `S`
"Add exercise" button opens the exercise picker (E06-T03, incl. create new). Exercise appears as a card in the session; cards can be reordered and removed (only if no sets logged, or with confirmation).

**Acceptance criteria**
- [ ] Same exercise can't be added twice to one session (prompt to jump to existing card)
- [ ] Reorder via drag (desktop) and move up/down (mobile)

**Depends on:** E08-T01, E06-T03

### E08-T03 · Last attempt RPC — `S`
`last_attempt(exercise, user, exclude_session)` per decision D6: returns sets (weight, reps, set_number), notes and the session date.

**Acceptance criteria**
- [ ] Returns empty when the user has never done the exercise
- [ ] Ignores the current session and sessions without sets for this exercise
- [ ] Unit/SQL tests for edge cases

**Depends on:** E08-T01

### E08-T04 · Exercise card with per-participant logging — `M`
Exercise card shows a participant switcher (avatars / segmented control). For the selected participant: list of sets (set #, weight, reps), "Add set" row with NumberSteppers, edit/delete a set. Collapsed card shows a summary per participant (e.g. "Jonas 3×8 @ 60 kg").

**Acceptance criteria**
- [ ] Adding a set takes ≤ 3 taps when values are pre-filled
- [ ] Optimistic UI with rollback on error
- [ ] Works one-handed at 360 px width

**Depends on:** E08-T02, E02-T05

### E08-T05 · Auto-load last attempt — `M`
When an exercise is added (or a participant is selected), load each participant's last attempt: show it as a muted reference row ("Last time · 12 Nov: 3×8 @ 57.5 kg") and pre-fill the "Add set" inputs with the matching set from last time (set 1 → last set 1, etc.). "Copy all" button logs all last-attempt sets in one tap for editing.

**Acceptance criteria**
- [ ] Pre-fill appears within 300 ms of selection (prefetched with the card)
- [ ] Clear visual difference between reference values and logged values
- [ ] Beyond last time's set count, pre-fill repeats the last logged set of this session

**Depends on:** E08-T03, E08-T04

### E08-T06 · Notes per participant per exercise — `S`
Notes field on each participant's section of an exercise card (autosave, debounced). Last attempt notes shown as reference.

**Acceptance criteria**
- [ ] Autosaves after 800 ms idle; shows saved state
- [ ] Max 1000 characters with counter

**Depends on:** E08-T01, E08-T04

### E08-T07 · Realtime sync between participants — `M`
Subscribe to session changes via Supabase Realtime; merge into the client cache. Show who recorded a set (small avatar) when not self.

**Acceptance criteria**
- [ ] A set logged on phone A appears on phone B within 2 s
- [ ] No duplicate rows from optimistic + realtime events
- [ ] Reconnects after network drop and refetches

**Depends on:** E08-T04

### E08-T08 · Personal record highlight — `S`
When a logged set beats the participant's previous best weight or estimated 1RM for that exercise, show a subtle PR badge.

**Acceptance criteria**
- [ ] PR detection matches E09 calculations (shared util)
- [ ] Badge uses muted ochre, no flashy animation

**Depends on:** E08-T04, E09-T01
