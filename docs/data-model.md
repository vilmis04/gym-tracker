# Data Model

All tables live in the `public` schema with **RLS enabled**. User ids are Clerk ids (`text`). `uid()` below means `auth.jwt()->>'sub'`.

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
| Column | Type | Notes |
|---|---|---|
| id | text PK | Clerk user id |
| display_name | text not null | |
| email | text not null unique | used for buddy search (exact match) |
| avatar_url | text | |
| locale | text not null default `'lt'` | `en` \| `lt` |
| theme | text not null default `'system'` | `light` \| `dark` \| `system` |
| created_at / updated_at | timestamptz | |

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
| name_normalized | text generated, unique together with `machine_id` | |
| description | text | |
| machine_id | uuid FK → machines, nullable | |
| created_by | text FK → profiles, nullable | |
| search_vector | tsvector generated | name + description, `simple` config + unaccent |
| created_at / updated_at | timestamptz | |

Indexes: `pg_trgm` GIN on `name_normalized` for fuzzy autocomplete.

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
| invite_status | enum `invited` \| `accepted` \| `declined` | owner inserted as `accepted` |
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
| profiles | self, buddies, users with a pending request to/from self, co-participants; search via RPC only | self (update); insert via webhook (service role) |
| buddy_connections | where self is requester or addressee | insert as requester; update status only as addressee; delete by either |
| machines, exercises, tags, exercise_tags | any authenticated user | insert by any authenticated user; update/delete own entries only (tags: seed only) |
| gym_sessions | session members + invited users | insert as owner; update/cancel by owner |
| session_participants | session members + invited users | owner invites (only buddies); invitee updates own `invite_status`; participant can leave |
| session_exercises, session_sets, session_exercise_notes | session members | session members, while session is not `cancelled` and not locked (D7) |

RLS is covered by SQL tests (pgTAP or Vitest against local Supabase) in CI.

## Key queries / RPCs

| RPC | Purpose |
|---|---|
| `search_users(query text)` | Exact email or display-name prefix match, excludes self, returns public fields and buddy status |
| `search_exercises(query text, limit int)` | Trigram + prefix ranking on name, includes machine name and tags |
| `last_attempt(exercise uuid, user text, exclude_session uuid)` | Sets of the user's most recent other session for that exercise (D6) |
| `exercise_progress(exercise uuid, user text, from, to)` | Per session: max weight, best est. 1RM, total volume, total reps |
| `session_summary(session uuid, user text)` | Per exercise: sets, volume, comparison to last attempt, PR flags |

## Seed data

- ~40 tags (muscle groups, movement patterns, equipment) with EN + LT labels
- ~30 common machines/equipment (Barbell, Dumbbells, Cable, Smith machine, Leg press, …)
- ~60 common exercises linked to machines and tags
