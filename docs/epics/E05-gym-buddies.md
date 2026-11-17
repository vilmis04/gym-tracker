# E05 · Gym Buddies

**Goal:** Users build a friend list ("gym buddies") through requests that the other person accepts.
**Milestone:** M2 · Train together
**Depends on:** E04

---

### E05-T01 · Buddy schema, RLS & helpers — `M`
Migration for `buddy_connections` (see [data-model.md](../data-model.md#buddy_connections)), uniqueness per pair, RLS policies, `are_buddies()` function, `search_users()` RPC, profile visibility policy for buddies.

**Acceptance criteria**
- [ ] A user cannot read or change connections they're not part of (RLS tests)
- [ ] Only the addressee can accept/decline; either side can delete
- [ ] Duplicate or self requests are rejected

**Depends on:** E04-T03

### E05-T02 · Find users & send request — `M`
"Add buddy" sheet with search (exact email or name prefix, min 3 chars), result list showing avatar, name and current relation (none / pending / buddy). "Send request" action.

**Acceptance criteria**
- [ ] Search never reveals full emails of non-buddies beyond an exact match
- [ ] Sending to someone who already requested you auto-accepts the existing request
- [ ] Empty and no-result states translated

**Depends on:** E05-T01, E02-T04

### E05-T03 · Incoming / outgoing requests — `S`
Requests tab with incoming (Accept / Decline) and outgoing (Cancel) lists. Badge count on Buddies nav item.

**Acceptance criteria**
- [ ] Accepting moves the user to the buddy list immediately
- [ ] Badge shows number of pending incoming requests

**Depends on:** E05-T01

### E05-T04 · Buddy list — `S`
List of buddies with avatar, name, "buddies since", and last shared session date. Remove buddy (with confirmation).

**Acceptance criteria**
- [ ] Sorted by most recent shared session, then name
- [ ] Removing a buddy does not delete shared sessions or their data

**Depends on:** E05-T01

### E05-T05 · Invite link — `S`
Personal shareable link/QR (`/buddies/add/{code}`) to send a request without searching — handy in the gym.

**Acceptance criteria**
- [ ] Opening the link while signed in shows the user and a "Send request" button
- [ ] Code can be regenerated (old link stops working)

**Depends on:** E05-T02

### E05-T06 · In-app notifications for buddy events — `S`
Lightweight notification indicator for new requests and accepted requests (in-app only for MVP, no email/push).

**Acceptance criteria**
- [ ] New incoming request appears without page reload (Realtime or refetch on focus)

**Depends on:** E05-T03
