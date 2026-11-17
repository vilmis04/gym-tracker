# Open Questions

Decisions the product owner made for MVP are in [product/vision.md](product/vision.md#product-decisions-mvp). The items below still need confirmation. Each has a proposed default so work isn't blocked.

| # | Question | Proposed default | Affects |
|---|---|---|---|
| Q1 | Should the exercise catalog be global (all users) or private per user + buddies? | Global shared catalog (D1) | E06 |
| Q2 | How are seeded exercises translated: `name_lt` column or a translations table? | `exercise_translations(exercise_id, locale, name, description)` for seeded rows only | E03-T05, E06-T01 |
| Q3 | Can any participant log for any other participant, or only for themselves? | Any accepted participant can log for anyone (D2) | E08 |
| Q4 | What happens to a removed participant's logged data? | Kept; visible in their own history; hidden from session views for others | E07-T05 |
| Q5 | Do we need kg ↔ lb in MVP? | No, kg only (D4) | E02-T05, E09 |
| Q6 | Should sessions support a per-exercise "planned" target (e.g. 3×8) set ahead of time? | Not in MVP (templates are post-MVP) | E08 |
| Q7 | Email or push notifications for invitations? | In-app only for MVP | E05-T06, E07 |
| Q8 | Should buddy search allow name search, or email only? | Exact email + name prefix (min 3 chars) | E05-T02 |
| Q9 | Should completed sessions be editable forever? | 7-day edit window (D7) | E07-T06 |
| Q10 | Use AI for auto-tags and exercise suggestions? | Rule-based in MVP (D5); AI evaluated post-MVP | E06-T05 |
| Q11 | Do we track set type (warm-up, working, drop set) or RPE? | Not in MVP; schema leaves room for a `set_type` column | E08 |
| Q12 | Progress overview page (`/progress`, by-exercise list and by-session calendar) is not in the mock-ups yet. | Reuse the desktop overview heatmap and a plain exercise list; design before E09-T05 | E09-T05, E09-T06 |
| Q13 | Session summary page (after **Complete**) is not in the mock-ups yet. | Same style as the progress page: per-exercise result and change vs last time | E09-T02 |
| Q14 | Where do outgoing buddy requests and the invite QR live now that the Buddies page has no Requests tab? | Inside the Add-buddy sheet (+ button) | E05-T03, E05-T05 |
| Q15 | Empty / onboarding states (new user Home, no buddies, no history) are not designed. | Icon + one sentence + one action, per the EmptyState component | E07-T07, E05-T04, E09 |
