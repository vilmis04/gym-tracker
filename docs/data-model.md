# Data Model

All tables live in the `public` schema with **RLS enabled**. User ids are Clerk ids (`text`). `uid()` is `public.uid()` (E04-T02, `20261123213000_add_uid_function.sql`): `auth.jwt()->>'sub'`, the Clerk user id of the request, `null` when signed out; `stable`, `security invoker`, empty `search_path`. Policies call it as `(select uid())` so Postgres evaluates it once per statement, e.g. `using (owner_id = (select uid()))`, and owner columns default to `uid()`. Never use Supabase's `auth.uid()` (it casts `sub` to uuid and fails on Clerk ids).

## Entity relationships

```
profiles ─┬─< buddy_connections >─┬─ profiles
          │
          ├─< gym_sessions (owner)
          │        │
          │        ├─< session_participants >── profiles
          │        │
          │        └─< session_exercises >── exercises ──> machines
          │                  │                   │
          │                  ├─< session_sets    └─< exercise_tags >── tags
          │                  └─< session_exercise_notes
          │
          └─ (created_by on exercises, machines)
```

## Tables

### `profiles`
E04-T03, `20261123213711_add_profiles.sql`. One row per Clerk user; Clerk owns the identity columns.

| Column | Type | Notes |
|---|---|---|
| id | text PK | Clerk user id (`user_…`), the JWT `sub` = `uid()` |
| display_name | text not null | from Clerk: "first last", else username, else the email's local part; trimmed, not empty |
| email | text not null unique | Clerk's primary email, stored trimmed + lowercase (check constraint); used for buddy search (exact match) |
| avatar_url | text | Clerk `image_url` when the user has a photo (`has_image`), else `null` (initials); `https://` only (check constraint) |
| locale | text not null default `'lt'` | `en` \| `lt` (check constraint = `LOCALES`) |
| theme | text not null default `'system'` | `light` \| `dark` \| `system` (check constraint = `THEME_PREFERENCES`) |
| invite_code | text not null unique | random URL-safe code for buddy invite links (E05-T05); default 96 random bits as 16 base64url characters (`pgcrypto`) |
| clerk_updated_at | timestamptz not null | Clerk's `updated_at` of the data last written; an older event never overwrites newer data (webhooks can arrive out of order) |
| created_at / updated_at | timestamptz not null default `now()` | `updated_at` is set on every update by the `profiles_set_updated_at` trigger (`set_updated_at()`, reusable) |

Writes: only the service role creates, changes the Clerk columns and deletes rows, through two functions (execute revoked from `public`, `anon`, `authenticated`):

- `sync_profile_from_clerk(incoming_id, incoming_display_name, incoming_email, incoming_clerk_updated_at, incoming_avatar_url default null) returns text` — upsert of the Clerk columns (normalizes email and name; never touches `locale`, `theme`, `invite_code`) unless the stored `clerk_updated_at` is the same or newer or the id is in `deleted_users`. Returns `synced`, `ignored_outdated` (also for a replayed event) or `ignored_deleted`. Used by the Clerk webhook and by the first-request fallback (`getCurrentProfile()`).
- `delete_profile_from_clerk(incoming_id) returns void` — records the id in `deleted_users` and deletes the profile (missing profile = no-op).

Users (`authenticated`): `select` and `update` of their own row (`id = (select uid())`), with column privileges `grant update (locale, theme)` only (any other column → `42501`); no insert / delete; `anon` has no privileges.

### `deleted_users`
E04-T03. Ids of Clerk users whose profile was deleted (`user.deleted`), so that a `user.created` / `user.updated` retried after the deletion doesn't recreate it (Clerk never reuses ids). `id text PK`, `deleted_at timestamptz not null default now()`. No personal data besides the id. RLS on with no policies and all privileges revoked from `anon` / `authenticated`: service role only. Full GDPR deletion of related data is E10-T05.

### `buddy_connections`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| requester_id | text FK → profiles | |
| addressee_id | text FK → profiles | |
| status | enum `pending` \| `accepted` \| `declined` | |
| created_at, responded_at | timestamptz | |

Constraints: `requester_id <> addressee_id`; unique index on `(least(requester_id, addressee_id), greatest(...))` so only one connection per pair. Removing a buddy deletes the row.

Helper SQL function: `are_buddies(a text, b text) returns boolean` (security definer, stable).

### `machines`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text not null | |
| name_normalized | text generated | `lower(unaccent(trim(name)))`, unique |
| created_by | text FK → profiles, nullable | null for seeded rows |
| created_at | timestamptz | |

### `exercises`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text not null | |
| name_normalized | text generated | unique together with `machine_id` (same name allowed on different machines) |
| description | text | |
| machine_id | uuid FK → machines, nullable | |
| created_by | text FK → profiles, nullable | |
| search_vector | tsvector generated | name + description, `simple` config + unaccent |
| created_at / updated_at | timestamptz | |

Indexes: `pg_trgm` GIN on `name_normalized` for fuzzy autocomplete.

### `exercise_translations` / `machine_translations`
| Column | Type | Notes |
|---|---|---|
| exercise_id / machine_id | uuid FK | PK (id, locale) |
| locale | text | `en` \| `lt` |
| name | text | trigram-indexed for search |
| description | text | exercises only |

Used for seeded content only; user-created entries keep the name they typed (E03-T05).

### `tags`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | text unique | e.g. `chest`, `legs`, `push` |
| label_en, label_lt | text | |
| category | enum `muscle_group` \| `movement` \| `equipment` \| `custom` | |

### `exercise_tags`
| exercise_id | uuid FK | |
|---|---|---|
| tag_id | uuid FK | PK (exercise_id, tag_id) |
| source | enum `auto` \| `manual` | |

### `gym_sessions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| owner_id | text FK → profiles | |
| title | text | optional, default generated ("Tuesday session") |
| scheduled_at | timestamptz not null | |
| started_at, completed_at | timestamptz | |
| status | enum `planned` \| `active` \| `completed` \| `cancelled` | |
| location | text | optional |
| created_at / updated_at | timestamptz | |

### `session_participants`
| Column | Type | Notes |
|---|---|---|
| session_id | uuid FK | PK (session_id, user_id) |
| user_id | text FK → profiles | |
| role | enum `owner` \| `participant` | |
| invite_status | enum `invited` \| `accepted` \| `declined` \| `left` \| `removed` | owner inserted as `accepted` |
| invited_by | text FK | |
| responded_at | timestamptz | |

Helper: `is_session_member(session uuid, user text)` → accepted participant.

### `session_exercises`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| session_id | uuid FK | |
| exercise_id | uuid FK | |
| position | int | order within session |
| added_by | text FK | |
| created_at | timestamptz | |

### `session_sets`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| session_exercise_id | uuid FK | |
| session_id | uuid FK | denormalized for RLS + realtime filter |
| user_id | text FK | whose set it is |
| set_number | int | 1..n per (session_exercise, user) |
| weight_kg | numeric(6,2) check ≥ 0 | |
| reps | int check 1..999 | |
| recorded_by | text FK | who typed it |
| created_at / updated_at | timestamptz | |

### `session_exercise_notes`
| Column | Type | Notes |
|---|---|---|
| session_exercise_id | uuid FK | PK (session_exercise_id, user_id) |
| session_id | uuid FK | denormalized |
| user_id | text FK | |
| note | text (≤ 1000 chars) | |
| updated_by | text FK | |
| updated_at | timestamptz | |

## RLS summary

| Table | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| profiles | self (E04-T03); buddies, users with a pending request to/from self, co-participants later (E05-T01 / E07-T01); search via RPC only | self: update of `locale`, `theme` only (column grant); insert / Clerk columns / delete via `sync_profile_from_clerk()` / `delete_profile_from_clerk()` (service role: webhook, first-request fallback) |
| buddy_connections | where self is requester or addressee | insert as requester; update status only as addressee; delete by either |
| machines, exercises, tags, exercise_tags | any authenticated user | insert by any authenticated user; update/delete own entries only (tags: seed only) |
| gym_sessions | session members + invited users | insert as owner; update/cancel by owner |
| session_participants | session members + invited users | owner invites (only buddies); invitee updates own `invite_status`; participant can leave |
| session_exercises, session_sets, session_exercise_notes | session members | session members, while session is not `cancelled` and not locked (D7) |

RLS is covered by SQL tests (pgTAP or Vitest against local Supabase) in CI.

## Key queries / RPCs

| RPC | Purpose |
|---|---|
| `sync_profile_from_clerk(…)`, `delete_profile_from_clerk(id)` | Service role only (E04-T03): Clerk → `profiles` sync, see [`profiles`](#profiles) |
| `search_users(query text)` | Exact email or display-name prefix match, excludes self, returns public fields and buddy status |
| `search_exercises(query text, limit int)` | Trigram + prefix ranking on name, includes machine name and tags |
| `last_attempt(exercise uuid, user text, exclude_session uuid)` | Sets of the user's most recent other session for that exercise (D6) |
| `exercise_progress(exercise uuid, user text, from, to)` | Per session: max weight, best est. 1RM, total volume, total reps |
| `session_summary(session uuid, user text)` | Per exercise: sets, volume, comparison to last attempt, PR flags |

## Seed data

- ~40 tags (muscle groups, movement patterns, equipment) with EN + LT labels
- ~30 common machines/equipment (Barbell, Dumbbells, Cable, Smith machine, Leg press, …)
- ~60 common exercises linked to machines and tags

## Dev/test fixtures (temporary)

Tables that exist only for foundation tooling. They are **not** part of the product schema and must be dropped (in a new migration) once real tables cover their purpose.

None right now. `sample_notes` (E01-T03, `20261117215612_add_sample_notes_fixture.sql`) was dropped by `20261123213711_add_profiles.sql` (E04-T03) together with its RLS test; the typed-query check (`src/lib/supabase/__typetests__/server-client.typetest.tsx`) and the RLS example (`tests/db/rls/profiles.test.ts`) now use `profiles`.

`uid_fixture_notes` (E04-T02) is not a migration: `tests/db/rls/third-party-auth.test.ts` creates it on the local stack while it runs (owner-only `select` / `insert` with `owner_id = (select uid())`) and drops it afterwards.
