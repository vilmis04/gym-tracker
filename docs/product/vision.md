# Product Vision

## Vision

> Train together, track together. Gym Tracker makes it easy for a small group of friends to log a shared workout on one phone or many, and see how each person improves over time.

## Problem

People who train with friends usually track workouts in notes apps, spreadsheets, or not at all. Solo-focused apps make shared sessions awkward: one person can't easily log sets for a partner, and "what did I lift last time?" means digging through history.

## Target users

| Persona | Description | Key needs |
|---|---|---|
| **Regular lifter** (primary) | Trains 2–5×/week, often with 1–3 friends | Fast logging, last attempt shown automatically, progress charts |
| **Session organizer** | Plans sessions and invites the group | Create session, invite buddies, see who joined |
| **Casual buddy** | Joins now and then, logs little | Low-friction login (Google), someone else can log for them |

Primary languages: **Lithuanian** and **English**. Mobile-first usage (in the gym), desktop for reviewing dashboards.

## Product principles

1. **Fast in the gym.** Logging a set takes ≤ 3 taps after the exercise is selected. Last attempt is pre-filled.
2. **Calm and minimal.** Earth tones, soft pastels, generous whitespace, no flashy colors or clutter.
3. **Together by default.** Sessions are shared; any participant can log for any participant.
4. **Your data is yours.** Users only see their own data and data shared with them through sessions.

## Scope

### MVP (in scope)

- Google login (Clerk)
- Gym buddies: search users, send/accept/decline/remove requests
- Gym sessions: create, invite buddies, accept/decline, start, complete
- Exercise catalog: name, description, machine, tags (manual + auto-generated)
- Searchable autocomplete exercise picker with "Create new" when nothing matches
- Per-participant set logging (weight, reps) and notes per exercise
- Auto-load of each participant's last attempt for the selected exercise
- Dashboards: user per session, user per exercise (progress over time)
- English + Lithuanian UI
- Light + dark mode
- Responsive, mobile-first

### Later (out of MVP)

- Workout templates / routines
- Rest timer
- Offline mode (PWA with sync)
- lb unit (MVP stores and shows kg)
- Exercise images/videos
- Social feed, comments, reactions
- Native mobile apps
- AI-generated tags/suggestions (MVP uses rule-based auto-tags)

## Product decisions (MVP)

| # | Decision | Rationale |
|---|---|---|
| D1 | Exercise and machine catalogs are **shared across all users**; names are unique (case/accent-insensitive). | Better autocomplete, less duplication. Revisit if catalog quality becomes a problem. |
| D2 | Any **accepted participant** can log sets and notes for any participant in that session. Each entry stores `recorded_by`. | One phone is often used for the whole group. |
| D3 | Only **gym buddies** can be invited to a session. | Keeps invites private and spam-free. |
| D4 | Weight is stored in **kg** (decimal, 0.25 step). Bodyweight exercises allow weight `0`. | Lithuanian market uses kg; lb is a later display preference. |
| D5 | Auto-tags are **rule-based** (keyword dictionary on name + machine), editable by the user. | Deterministic, free, works offline; can be upgraded to AI later. |
| D6 | "Last attempt" = the user's sets for the same exercise in their most recent **other** session that has at least one set. | Matches how lifters think about "last time". |
| D7 | Completed sessions stay editable by participants for 7 days, then become read-only. | Fix typos without letting history drift. |
| D8 | Dashboards show your own data; buddy data is visible only for sessions you both took part in. | Privacy by default. |

## Glossary

| Term (EN) | Term (LT) | Meaning |
|---|---|---|
| Gym buddy | Sporto draugas | A user with an accepted buddy connection |
| Session | Treniruotė | A planned or active workout with one or more participants |
| Participant | Dalyvis | A user invited to a session who accepted |
| Exercise | Pratimas | Catalog entry (e.g. "Bench press") |
| Machine | Treniruoklis | Equipment used (e.g. "Smith machine", "Barbell") |
| Tag | Žyma | Label for grouping/searching (e.g. "chest", "push") |
| Set | Serija | One weight × reps entry |
| Last attempt | Paskutinis bandymas | The participant's sets for the exercise from their previous session |
| Volume | Apimtis | Σ (weight × reps) |
| Estimated 1RM | Apskaičiuotas 1RM | One-rep max estimate (Epley: w × (1 + reps/30)) |

## Success metrics

- Time to log a set (after exercise is selected): median < 5 s
- % of exercises where last attempt was pre-filled and used: > 60%
- Weekly active users who log ≥ 1 session with a buddy: tracked from launch
- Crash-free sessions > 99.5%
