# E09 · Progress Dashboards

**Goal:** Overview pages with multiple slices — user per session and user per exercise — so progress over time is easy to see.
**Milestone:** M3 · See progress
**Depends on:** E08

---

### E09-T01 · Metrics library & RPCs — `M`
Shared metric definitions (TS util + SQL): top set weight, estimated 1RM (Epley), volume (Σ w×r), total reps, set count, PRs. RPCs `exercise_progress()` and `session_summary()` (see [data-model.md](../data-model.md#key-queries--rpcs)).

**Acceptance criteria**
- [ ] TS and SQL implementations produce identical results on a fixture dataset
- [ ] Bodyweight (0 kg) exercises use reps-based metrics

**Depends on:** E08-T01

### E09-T02 · Dashboard: user per session — `M`
Session summary page: for a chosen participant, each exercise with sets, volume and delta vs last attempt (↑ / ↓ / =), PR badges, session totals (duration, exercises, sets, volume). Participant switcher to view buddies in that session.

**Acceptance criteria**
- [ ] Reachable from session history and shown after "Complete session"
- [ ] Deltas computed per exercise against last attempt (D6)
- [ ] Only participants of the session can view it

**Depends on:** E09-T01, E07-T05

### E09-T03 · Dashboard: user per exercise — `M`
Exercise progress page: pick exercise (Combobox, limited to exercises the user has logged), line chart over time with metric selector (top weight / est. 1RM / volume / reps), range selector (1M / 3M / 6M / 1Y / All), history table of sessions with sets and notes, PR summary.

**Acceptance criteria**
- [ ] Chart readable in both themes and on 360 px width
- [ ] Clicking a point/row opens that session summary
- [ ] Empty state when fewer than 2 data points

**Depends on:** E09-T01

### E09-T04 · Compare with buddy — `S`
On the exercise progress page, optionally overlay one buddy's series for the same exercise, using only sessions both took part in (D8).

**Acceptance criteria**
- [ ] Only buddies with shared sessions for that exercise are selectable
- [ ] Series colors use distinct chart tokens with legend

**Depends on:** E09-T03

### E09-T05 · Progress overview page — `M`
Progress landing page with slices as tabs: **By exercise** (list of exercises with sparkline + latest top set + trend), **By session** (calendar/heatmap of sessions + list). Summary tiles: sessions this month, total volume this month, current weekly streak.

**Acceptance criteria**
- [ ] Each list item navigates to the matching detail dashboard
- [ ] Loads in < 1 s for a user with 1 year of data (300 sessions)

**Depends on:** E09-T02, E09-T03

### E09-T06 · Filters by tag / muscle group — `S`
Filter the By-exercise slice and volume tiles by tag (e.g. "legs") to see progress per muscle group.

**Acceptance criteria**
- [ ] Filter persists in URL query params (shareable/bookmarkable)

**Depends on:** E09-T05
