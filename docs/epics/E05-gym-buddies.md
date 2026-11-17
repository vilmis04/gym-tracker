# E05 · Gym Buddies

**Goal:** Users build a friend list ("gym buddies") through requests that the other person accepts.
**Milestone:** M2 · Train together
**Depends on:** E04

---

### E05-T01 · Buddy schema, RLS & helpers — `M`
**Why:** Buddy connections decide who can see whose profile and who can be invited to sessions, so the rules must live in the database.

**Scope**
- Migration for `buddy_connections` (see [data-model.md](../data-model.md#buddy_connections)) with status enum `pending | accepted | declined`.
- Constraints: no self-requests; one row per pair regardless of direction (unique index on `least/greatest`).
- RLS:
  - SELECT: requester or addressee.
  - INSERT: only as `requester_id = uid()` with status `pending`.
  - UPDATE: only the addressee, only `pending → accepted | declined`, sets `responded_at`.
  - DELETE: either side (cancel request or remove buddy).
- `are_buddies(a, b)` SQL function (`security definer`, `stable`).
- `search_users(query)` RPC: exact email match or display-name prefix (≥ 3 chars), excludes self, max 20 results, returns `id, display_name, avatar_url, relation` (`none | pending_out | pending_in | buddy`). Does not return emails.
- Extend `profiles` SELECT policy: visible to buddies and to users with a pending request either way.
- A declined request can be sent again after 30 days (prevents spam).

**Out of scope:** UI.

**Acceptance criteria**
- [ ] RLS tests: user C cannot see or change a connection between A and B.
- [ ] Only the addressee can accept or decline; the requester trying to accept gets an error.
- [ ] Sending a request to yourself, or a second request for the same pair, is rejected.
- [ ] `search_users` never returns an email field, and never returns the caller.
- [ ] `are_buddies(A, B)` is true only for `accepted` connections, in both directions.
- [ ] After a decline, a new request from the same requester is rejected for 30 days.

**Depends on:** E04-T03

### E05-T02 · Find users & send request — `M`
**Why:** Users need to find their friends in the app and connect with them quickly.

**Scope**
- "Add buddy" button on the Buddies page opens a sheet with a search field (uses `search_users`).
- Result rows: avatar, name, and an action depending on relation: **Send request**, **Requested** (disabled, with cancel), **Accept** (if they already requested you), **Buddies** (disabled).
- If you send a request to someone who already requested you, both become buddies automatically.
- Hint text: "Search by full email or name".
- Toast confirmations and translated errors.

**Out of scope:** Invite link (E05-T05).

**Acceptance criteria**
- [ ] Searching a full email finds that user; a partial email finds nothing; a name prefix of ≥ 3 letters finds matching users.
- [ ] Each result shows the correct action for the current relation, and it updates right after the action without reload.
- [ ] Sending to someone who already requested you makes you buddies immediately.
- [ ] Empty, loading and no-result states are translated and look calm in both themes.
- [ ] e2e test: A sends, B sees request.

**Depends on:** E05-T01, E02-T04

### E05-T03 · Incoming / outgoing requests — `S`
**Why:** Users need to act on requests they received and keep track of the ones they sent.

**Scope**
- **Incoming:** shown as cards at the top of the Buddies page ("Tomas wants to be your gym buddy") with **Accept** / **Decline** (no separate Requests tab — see [mock-ups](../ui-mockups.md)).
- **Outgoing:** avatar, name, sent date, **Cancel**, listed in the Add-buddy sheet (Q14).
- No count badge on the nav item; Home shows pending buddy requests together with session invitations.
- Optimistic updates with rollback on error.

**Out of scope:** Push/email notifications.

**Acceptance criteria**
- [ ] Accepting moves the person to the buddy list immediately and the request card disappears (also from Home).
- [ ] Declining removes the request from the incoming list; the requester sees it removed from their outgoing list (the reason isn't shown).
- [ ] Cancelling an outgoing request removes it for both users.
- [ ] The pending count on Home is correct and the row is hidden at 0.
- [ ] Empty states for both lists.

**Depends on:** E05-T01

### E05-T04 · Buddy list — `S`
**Why:** The buddy list is the people you can train with; it should be easy to scan and manage.

**Scope**
- Buddies page tab **Buddies**: avatar, name, "Buddies since {date}", "Last trained together {relative date}" or "Not trained together yet".
- Sorted by last shared session (most recent first), then name.
- Tapping a row: **Start session with…** (opens E07-T02 with the buddy pre-selected). Row "⋯" menu (long-press on mobile): **Remove buddy** (confirmation dialog). No "View progress together" (D10).
- "Add buddy" is a round + button in the page header.
- Local filter field when the list has more than 10 buddies.

**Out of scope:** Buddy profile page.

**Acceptance criteria**
- [ ] List shows only accepted buddies in the described order.
- [ ] Removing a buddy requires confirmation and removes them from both users' lists.
- [ ] After removal, past shared sessions and their data stay unchanged for both users.
- [ ] "Start session with…" opens the create form with that buddy already invited.
- [ ] Empty state with an "Add buddy" button.

**Depends on:** E05-T01

### E05-T05 · Invite link — `S`
**Why:** In the gym it's faster to show a QR code than to type an email.

**Scope**
- Column `profiles.invite_code` (random, URL-safe, unique).
- "Share my invite" in the Add-buddy sheet: shows link `/{locale}/buddies/add/{code}`, a QR code, a copy button and native share (Web Share API).
- Opening the link: if signed out, go through sign-in and come back; then show the inviter's avatar/name and a **Send request** button (or auto-accept if they already requested).
- **Regenerate link** invalidates the old code.

**Out of scope:** Links that expire automatically.

**Acceptance criteria**
- [ ] Scanning the QR with a phone opens the link and, after sign-in, shows the inviter with a working "Send request" button.
- [ ] An invalid or regenerated code shows a friendly "Link no longer valid" page.
- [ ] Opening your own link shows "This is your link".
- [ ] Share uses the native share sheet on mobile and copy-to-clipboard on desktop.

**Depends on:** E05-T02

### E05-T06 · In-app notifications for buddy events — `S`
**Why:** Users should notice new requests and accepted requests without checking the Buddies page.

**Scope**
- Subscribe to `buddy_connections` changes for the current user (Supabase Realtime), plus refetch on window focus.
- Toast when a new request arrives ("Jonas wants to be your gym buddy" with **View**) or when someone accepts yours.
- Updates the pending count on Home and the request cards live.

**Out of scope:** Email and push notifications; a notifications inbox.

**Acceptance criteria**
- [ ] When A sends a request, B (with the app open) sees a toast and the request card within 3 seconds, without reloading.
- [ ] When B accepts, A sees a toast and B appears in A's list.
- [ ] No duplicate toasts for the same event.
- [ ] Works after the phone wakes from sleep (refetch on focus).

**Depends on:** E05-T03
