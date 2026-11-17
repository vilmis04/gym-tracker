# UI Mock-ups

**Design canvas:** [Gym Tracker UI](https://claude.ai/artifact/FsPAXBmTkAVZ3SPNsBWqNS#page-dcb81aee8d83)

The canvas is the visual reference for the MVP screens. It has four rows: **Mobile · light**, **Mobile · dark**, **Desktop · light** and **Desktop · dark**. Every screen exists in both themes. Mobile frames are 390 × 844 px; desktop pages are fluid (designed at 1440 px).

When the mock-ups and an epic disagree, the epic is the source of truth for behaviour and the mock-up for layout. Both should be updated together.

## Screens

| Screen | Mobile | Desktop | Tasks |
|---|---|---|---|
| Home / overview | Active session + Continue, one "Up next" session, invitations link | Adds month stats, 12-month activity heatmap, week agenda | E07-T07, E09-T05 |
| Live session | One exercise open at a time, participant chips, last-time line, kg/reps steppers, **Add set** | All participants' logging columns side by side, exercise list on the left | E07-T05, E08-T02, E08-T04, E08-T05 |
| Add exercise | Bottom sheet: search, results (name + machine), **Create '…'** | — | E06-T03 |
| Create exercise | Name (pre-filled), machine, suggested tags, optional description, **Create and add to session** | — | E06-T04 |
| New session | When, who's coming (buddy chips), optional title/location, **Start now** / **Plan for later** | — | E07-T02 |
| Sessions | Upcoming / Invitations / History tabs, + button for a new session | — | E07-T03, E07-T04 |
| Progress (exercise) | Exercise picker, best value with change in kg and %, chart with PR points, metric buttons | Adds range selector and recent sessions list | E09-T03 |
| Buddies | Incoming request card, buddy list, + button to add | — | E05-T02…T04 |

## Design decisions from the mock-up review

These came out of review and are reflected in the epics:

1. **One main job per screen.** Secondary details and actions (notes, Copy all, tags, edit/remove) live behind a "⋯" menu or a collapsed row instead of on the main view.
2. **No comparing with other users.** Progress shows only your own data (decision D10). E09-T04 is dropped from the MVP.
3. **Change is shown in absolute value and percent**, e.g. "+10 kg · +14% in 3 months".
4. **Collapsed exercise cards show your own result** (e.g. "4 × 8 · 82.5 kg"), not a total set count across participants.
5. **No count badges on the navigation.** Pending invitations and buddy requests show up on Home and in tab labels.
6. **No visible scroll bars** in the app shell; areas still scroll by touch/trackpad.

## Not designed yet

See [open-questions.md](open-questions.md) Q12–Q15: progress overview page, session summary, Add-buddy sheet with outgoing requests and invite QR, and the empty/onboarding states.
