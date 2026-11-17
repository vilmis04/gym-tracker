# E06 · Exercise Catalog

**Goal:** A shared catalog of exercises (name, description, machine, tags) that is fast to search and easy to extend from inside a session.
**Milestone:** M2 · Train together
**Depends on:** E04, E02-T04

---

### E06-T01 · Catalog schema & seed — `M`
Migrations for `machines`, `exercises`, `tags`, `exercise_tags` with normalized-name uniqueness, trigram index, RLS (read all, write own). Seed tags (EN/LT), common machines, ~60 exercises. Decide content translation approach for seeded data.

**Acceptance criteria**
- [ ] Creating "Bench Press" when "bench press" exists (same machine) is rejected as duplicate
- [ ] Seed runs idempotently on `db:reset`
- [ ] RLS tests: users can't edit others' exercises

**Depends on:** E04-T03

### E06-T02 · Exercise search RPC — `S`
`search_exercises(query, limit)` ranking: exact → prefix → trigram similarity → description match. Returns machine name and tags. Accent-insensitive.

**Acceptance criteria**
- [ ] p95 < 100 ms on 10k exercises (seeded load test)
- [ ] "spaud" finds "Spaudimas gulint"; "bench" finds "Bench press"

**Depends on:** E06-T01

### E06-T03 · Exercise picker (autocomplete) — `M`
Searchable dropdown built on the Combobox (E02-T04): shows name, machine, tag chips; recently used exercises shown before typing; "Create '{query}'" button when no match opens the create form pre-filled with the query.

**Acceptance criteria**
- [ ] Empty query shows the user's 8 most recently used exercises
- [ ] "Create new" appears when there's no exact normalized match
- [ ] Selecting returns the exercise id to the caller

**Depends on:** E06-T02, E02-T04

### E06-T04 · Create / edit exercise form — `M`
Form (sheet on mobile): name (required), description (optional), machine (Combobox with create-new), tags (multi-select Combobox, optional). Auto-tags (E06-T05) are pre-suggested and editable. Edit allowed for own exercises.

**Acceptance criteria**
- [ ] Duplicate name shows inline error with a link to the existing exercise
- [ ] Creating from the picker returns to the session with the new exercise selected
- [ ] Validation messages translated

**Depends on:** E06-T03, E06-T05

### E06-T05 · Rule-based auto-tagging — `S`
`lib/tags/autoTag(name, machineName)` using a keyword dictionary (EN + LT stems) → tag slugs (e.g. "bench|krūtin" → `chest`, `push`; "squat|pritūp" → `legs`). Tags saved with `source = auto`.

**Acceptance criteria**
- [ ] ≥ 90% of seeded exercises get at least one correct tag (fixture test)
- [ ] User can remove auto tags; removed tags are not re-added on edit

**Depends on:** E06-T01

### E06-T06 · Machine management — `S`
Create machine from Combobox ("Create '{query}'"), duplicate check by normalized name.

**Acceptance criteria**
- [ ] New machine immediately selectable in the form

**Depends on:** E06-T01, E02-T04

### E06-T07 · Exercise library page — `S`
Browse/search page listing exercises with filter by tag and machine; opens exercise detail (description, tags, link to personal progress E09-T03).

**Acceptance criteria**
- [ ] Filter by multiple tags (AND)
- [ ] Paginated / virtualized for large lists

**Depends on:** E06-T02
