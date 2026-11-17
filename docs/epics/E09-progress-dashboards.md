# E09 · Progress Dashboards

**Goal:** Overview pages with multiple slices — user per session and user per exercise — so progress over time is easy to see.
**Milestone:** M3 · See progress
**Depends on:** E08

---

### E09-T01 · Metrics library & RPCs — `M`
**Why:** Every dashboard, PR badge and comparison must calculate numbers the same way; one definition avoids confusing differences.

**Scope**
- Metric definitions (TS in `lib/metrics`, mirrored in SQL):
  - **Top set**: heaviest weight in a session (tie → more reps).
  - **Estimated 1RM** (Epley): `w × (1 + reps / 30)`, only for reps ≤ 12; `w` when reps = 1.
  - **Volume**: Σ weight × reps.
  - **Total reps**, **set count**.
  - **Bodyweight exercises** (all weights 0): use total reps and max reps instead.
  - **PR**: a session's metric higher than all earlier sessions.
- RPCs:
  - `exercise_progress(exercise, user, from, to)` → one row per session: date, session_id, top set, best e1RM, volume, total reps, sets, is_pr flags.
  - `session_summary(session, user)` → per exercise: sets, volume, top set, delta vs last attempt, PR flags; plus totals and duration.
- Access: own data, or a co-participant's data only for shared sessions (D8).
- Fixture dataset (seed script `db:seed:demo`) with ~6 months of realistic data for 3 users.

**Out of scope:** Charts.

**Acceptance criteria**
- [ ] TS and SQL produce identical results on the fixture dataset (shared test).
- [ ] e1RM for 100 kg × 5 = 116,7 kg; for reps > 12 e1RM is not calculated.
- [ ] Bodyweight exercises return reps-based metrics and no weight PRs.
- [ ] A user cannot get progress for someone else's non-shared sessions (RLS test).
- [ ] `exercise_progress` for 1 year of data responds in under 150 ms.

**Depends on:** E08-T01

### E09-T02 · Dashboard: user per session — `M`
**Why:** Right after a workout and later in history, users want a clear summary of what they did and whether they improved.

**Scope**
- Page `/[locale]/progress/session/[sessionId]`.
- Participant switcher (defaults to the current user; other participants of the session can be selected).
- Totals: duration, exercises, sets, total volume, number of PRs.
- Per exercise: sets list, top set, volume, delta vs last attempt (↑ / ↓ / = with value, muted colors), PR chips, note.
- Link from each exercise to its progress page (E09-T03).
- Shown after **Complete session** and reachable from History and Home.

**Out of scope:** Sharing the summary outside the app.

**Acceptance criteria**
- [ ] Totals and per-exercise numbers match the logged sets (fixture test).
- [ ] Delta arrows compare to the participant's last attempt (D6); "First time" when there's none.
- [ ] Switching participant shows that person's summary for the same session.
- [ ] Non-participants get a 404.
- [ ] Readable on a 360 px phone in both themes and languages.

**Depends on:** E09-T01, E07-T05

### E09-T03 · Dashboard: user per exercise — `M`
**Why:** The main progress view: how one exercise developed over time.

**Scope**
- Page `/[locale]/progress/exercise/[exerciseId]`.
- Exercise selector (Combobox limited to exercises the user has logged) at the top.
- Metric selector: **Top weight**, **Est. 1RM**, **Volume**, **Total reps** (bodyweight: reps metrics only); a 2 × 2 button grid on mobile.
- Range selector: 1M / 3M / 6M / 1Y / All (default 3M). On mobile it's in the exercise header menu, so the main view stays on the default 3M; desktop shows it next to the metric buttons.
- Line chart (Recharts, chart tokens) with PR points marked; tooltip with date, value and sets.
- Headline instead of stat tiles: current best in large type, with the change over the selected range in absolute value **and** percent ("+10 kg · +14% in 3 months").
- History list: date, sets (e.g. "60×8, 60×8, 57,5×7"), top set; newest first; paginated. Shown below the chart on desktop; on mobile it's reached by scrolling below the metric buttons.
- Only the current user's data is shown (D10).
- Selected metric and range stored in URL params.

**Out of scope:** Buddy comparison (E09-T04).

**Acceptance criteria**
- [ ] Chart, tiles and table show the same data for the selected range and metric.
- [ ] Tapping a chart point or table row opens that session's summary.
- [ ] With fewer than 2 sessions, a friendly empty state replaces the chart ("Log this exercise again to see progress").
- [ ] Chart is readable in both themes, at 360 px, and has an accessible text alternative (summary label plus the history list).
- [ ] The change shows both the absolute value and the percent, in both locales.
- [ ] Changing metric/range doesn't reload the page and can be shared via URL.

**Depends on:** E09-T01

### E09-T04 · Compare with buddy — `S`

> **Dropped from MVP (decision D10, mock-up review):** progress shows only your own data. Kept below for reference only; do not implement.

**Why:** Training together is motivating; comparing progress with a buddy on the same exercise adds to that, within privacy limits.

**Scope**
- "Compare with" selector on the exercise progress page listing buddies who have logged this exercise in sessions shared with the user.
- Overlays the buddy's series (different chart token, legend with names/avatars); tiles show both users side by side.
- Only data from shared sessions is used for the buddy (D8).
- Option to show values as % change from the start of the range (fairer comparison between different strength levels).

**Out of scope:** Leaderboards; comparing more than one buddy.

**Acceptance criteria**
- [ ] Only buddies with shared sessions for this exercise can be selected.
- [ ] The buddy's series contains only shared-session data (RLS + fixture test).
- [ ] The two series use clearly different, calm colors, with a legend, in both themes.
- [ ] "% change" mode starts both lines at 0%.

**Depends on:** E09-T03

### E09-T05 · Progress overview page — `M`
**Why:** Users need an entry point to see all their progress at a glance and drill into slices.

**Scope**
- Page `/[locale]/progress` with summary numbers: sessions this month, weekly streak (weeks in a row with ≥ 1 session), records this month (total volume dropped from the headline to keep it short). The same numbers and the 12-month heatmap also appear on desktop Home. Layout of this page is not designed yet (Q12).
- Slice tabs:
  - **By exercise:** list of logged exercises with sparkline (last 8 sessions, top weight or e1RM), latest top set, trend arrow, last date; sortable by last done / most improved / name.
  - **By session:** activity heatmap/calendar (last 12 months, earth-tone scale) + list of sessions linking to summaries.
- Each item links to the matching detail dashboard (E09-T02 / E09-T03).
- One RPC per tab (`progress_overview_exercises`, `progress_overview_sessions`) to keep it fast.

**Out of scope:** Body weight / body measurements tracking.

**Acceptance criteria**
- [ ] Tiles, sparklines and calendar match the underlying data (fixture test).
- [ ] Page loads in under 1 second for a user with 300 sessions.
- [ ] Every list item and calendar day with a session navigates to the correct detail view.
- [ ] Empty state for new users with a link to start a session.
- [ ] Calendar colors pass contrast against the background in both themes.

**Depends on:** E09-T02, E09-T03

### E09-T06 · Filters by tag / muscle group — `S`
**Why:** Users want to see progress for a muscle group (e.g. legs), not only one exercise at a time.

**Scope**
- Tag filter (multi-select chips, muscle-group tags first) on the overview page.
- Filters the **By exercise** list, the volume tile and the calendar intensity (volume of matching exercises only).
- Filter kept in the URL (`?tags=legs,back`).

**Out of scope:** Custom saved views.

**Acceptance criteria**
- [ ] Selecting "legs" shows only exercises tagged legs and recalculates volume for them only.
- [ ] Multiple tags combine as OR (any matching tag), clearly labeled in the UI.
- [ ] Reloading or sharing the URL keeps the filter.
- [ ] Clearing filters restores the full overview.

**Depends on:** E09-T05
