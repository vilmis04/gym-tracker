# E06 · Exercise Catalog

**Goal:** A shared catalog of exercises (name, description, machine, tags) that is fast to search and easy to extend from inside a session.
**Milestone:** M2 · Train together
**Depends on:** E04, E02-T04

---

### E06-T01 · Catalog schema & seed — `M`
**Why:** Exercises, machines and tags are the building blocks of every logged set; they need a clean, duplicate-free structure and useful starting content.

**Scope**
- Migrations for `machines`, `exercises`, `tags`, `exercise_tags` plus `exercise_translations` / `machine_translations` (decision Q2) — see [data-model.md](../data-model.md).
- `name_normalized` generated columns using `lower(f_unaccent(trim(name)))`.
- Uniqueness: machine `name_normalized`; exercise `(name_normalized, coalesce(machine_id, '00000000-…'))` (same name allowed on different machines, e.g. "Row" on Cable vs Machine).
- Trigram GIN indexes on `name_normalized` for exercises, machines and translation names.
- RLS: all signed-in users can read; insert with `created_by = uid()`; update/delete only own rows; exercises in use (referenced by `session_exercises`) cannot be deleted, only edited.
- Tags are seed-only (users can attach existing tags, not create new ones in MVP) — categories `muscle_group`, `movement`, `equipment`.
- Seed: ~40 tags (EN + LT), ~30 machines/equipment, ~60 common exercises with machine, description and tags, in EN and LT.

**Out of scope:** UI; user-created tags.

**Acceptance criteria**
- [ ] `db:reset` creates all tables and seed data; running the seed twice creates no duplicates.
- [ ] Inserting "bench press" when "Bench Press" exists on the same machine fails with a unique violation; on a different machine it succeeds.
- [ ] RLS tests: user B cannot update or delete user A's exercise or machine; anyone signed in can read all.
- [ ] Deleting an exercise that is used in a session fails.
- [ ] Every seeded exercise has at least one tag and both EN and LT names.

**Depends on:** E04-T03

### E06-T02 · Exercise search RPC — `S`
**Why:** The exercise picker is used in every session; search must be fast, forgiving of typos and accents, and work in both languages.

**Scope**
- `search_exercises(query text, limit int default 20)` SQL function returning `id, name, display_name (for locale), machine_name, tags[], score`.
- Ranking order: exact normalized match → prefix match → trigram similarity (≥ 0.3) → description contains query. Ties: exercises the caller used most recently, then alphabetically.
- Searches original names and translations; accent- and case-insensitive.
- `recent_exercises(limit int default 8)`: the caller's most recently logged exercises.
- Query length < 2 returns an empty result (UI shows recents instead).

**Out of scope:** Full-text search on long descriptions.

**Acceptance criteria**
- [ ] "spaud" finds "Spaudimas gulint"; "bench" finds "Bench press"; "benhc" (typo) still finds "Bench press".
- [ ] An exact match is always ranked first.
- [ ] Results include machine name and tags, so no extra request is needed per result.
- [ ] p95 under 100 ms with 10 000 exercises (seeded load test with `EXPLAIN ANALYZE` in the PR).
- [ ] `recent_exercises` returns only the caller's exercises, newest first, without duplicates.

**Depends on:** E06-T01

### E06-T03 · Exercise picker (autocomplete) — `M`
**Why:** This is the main way users add exercises to a session: a searchable dropdown with suggestions and a button to create a new exercise when nothing is found.

**Scope**
- `ExercisePicker` built on the Combobox (E02-T04), backed by `search_exercises` and `recent_exercises`.
- Before typing: section "Recently used" (up to 8). While typing: ranked results.
- Each result: exercise name (bold match), machine name (muted), up to 3 tag chips.
- When there's no exact normalized match: footer button **"+ Create '{query}'"**, which opens the create form (E06-T04) with the name pre-filled.
- Props: `onSelect(exercise)`, `excludeIds` (already in the session; shown as "Already added" and selectable to jump to it).

**Out of scope:** The create form itself (E06-T04).

**Acceptance criteria**
- [ ] Opening the picker without typing shows the user's recent exercises (or popular seeded ones for new users).
- [ ] Typing shows ranked results within 300 ms of the last keystroke on a normal connection.
- [ ] "Create '{query}'" appears only when no exact normalized match exists, and opens the form with the name pre-filled.
- [ ] Exercises already in the session are marked "Already added".
- [ ] Fully usable by keyboard and on a 360 px phone screen.

**Depends on:** E06-T02, E02-T04

### E06-T04 · Create / edit exercise form — `M`
**Why:** When an exercise isn't in the catalog, users must be able to add it in a few seconds without leaving the session.

**Scope**
- Form in a sheet (mobile) / dialog (desktop) with fields:
  - **Name** (required, 2–80 chars)
  - **Description** (optional, ≤ 500 chars)
  - **Machine** (optional; Combobox with create-new, E06-T06)
  - **Tags** (optional; multi-select Combobox of existing tags). Auto-suggested tags (E06-T05) are pre-selected and marked "suggested"; they update as name/machine change until the user edits tags manually.
- Zod schema shared between client and Server Action.
- Duplicate check before submit (debounced) and on save: "This exercise already exists" with **Use existing**.
- After creating from the picker, the new exercise is selected and the user returns to the session.
- Edit mode for exercises the user created (same form). Non-owners see read-only details.

**Out of scope:** Images/videos; deleting exercises (only unused own exercises can be deleted, from the library page).

**Acceptance criteria**
- [ ] Creating an exercise from the picker takes the user back to the session with the new exercise added.
- [ ] An empty or 1-character name shows a translated validation error and nothing is saved.
- [ ] Entering an existing name (any case or accents) on the same machine shows the duplicate message with a working **Use existing**.
- [ ] Suggested tags appear for names like "Bench press" and can be removed before saving.
- [ ] Only the creator sees the Edit action; others can view but not edit.
- [ ] Saved data shows correctly in the picker and library right away.

**Depends on:** E06-T03, E06-T05

### E06-T05 · Rule-based auto-tagging — `S`
**Why:** Tags make search and dashboards (per muscle group) useful, but users rarely add them by hand; auto-suggestions fill the gap.

**Scope**
- `lib/tags/autoTag(name: string, machineName?: string): TagSlug[]` — pure function.
- Rule dictionary (`lib/tags/rules.ts`) of keyword stems in EN and LT → tag slugs, e.g.:
  - `bench|chest|fly|krūtin|spaudimas gulint` → `chest`, `push`
  - `squat|leg press|pritūp|kojų` → `legs`, `quads`
  - `row|pull|lat|trauk` → `back`, `pull`
  - `curl|bicep|bicepsas` → `biceps`; `tricep|dip|pushdown` → `triceps`
  - Machine-based: `dumbbell|hantel` → `dumbbell`; `barbell|štang` → `barbell`; `cable|lyn` → `cable`
- Accent-insensitive, word-boundary-aware matching; returns unique slugs, max 5.
- Saved with `source = 'auto'`; tags the user adds are `source = 'manual'`.
- Tags the user removed are remembered on the form so they aren't re-added during the same edit.

**Out of scope:** AI tagging (post-MVP, Q10).

**Acceptance criteria**
- [ ] Fixture test: at least 90% of seeded exercises get at least one correct tag, and none get a clearly wrong muscle group.
- [ ] "Spaudimas gulint" and "Bench press" both produce `chest` and `push`.
- [ ] "Squash" does not produce `legs` (word boundaries respected).
- [ ] Function runs on both client (live suggestions) and server, with no network calls.
- [ ] Adding a keyword rule requires only editing `rules.ts` (documented in the file).

**Depends on:** E06-T01

### E06-T06 · Machine management — `S`
**Why:** Many exercises depend on the machine (e.g. "Chest press" on two different machines); users need to pick or add machines easily.

**Scope**
- `MachinePicker` (Combobox) backed by a `search_machines(query)` RPC (same ranking idea as exercises).
- "+ Create '{query}'" creates a machine with just a name (2–60 chars) in one tap, with a duplicate check by normalized name.
- Machines created by the user can be renamed by them (from the library page).

**Out of scope:** Machine photos, gym location of machines.

**Acceptance criteria**
- [ ] Typing "smith" suggests "Smith machine"; "hantel" suggests "Hanteliai / Dumbbells".
- [ ] Creating a new machine selects it in the exercise form immediately.
- [ ] Creating "smith machine" when "Smith Machine" exists selects the existing one instead of creating a duplicate.
- [ ] RLS: only the creator can rename a machine.

**Depends on:** E06-T01, E02-T04

### E06-T07 · Exercise library page — `S`
**Why:** Outside sessions, users want to browse exercises, check details and jump to their progress for one exercise.

**Scope**
- Page `/[locale]/exercises` (linked from Progress and the avatar menu): search field, filters by tag (multi, AND) and machine, toggle "Only exercises I've done".
- Infinite scroll / pagination (30 per page).
- Exercise detail page: name, machine, description, tags, created by (name or "Gym Tracker" for seeded), "My last attempt" summary, link **View my progress** (E09-T03), Edit/Delete for owners (delete only if unused).

**Out of scope:** Favorites.

**Acceptance criteria**
- [ ] Filtering by "legs" + "barbell" shows only exercises with both tags.
- [ ] Search and filters are kept in the URL (back button restores them).
- [ ] Scrolling 300+ exercises stays smooth on a mid-range phone.
- [ ] Detail page shows the user's last attempt if one exists.
- [ ] Owner can delete an unused exercise; a used exercise shows "Can't delete: used in sessions".

**Depends on:** E06-T02
