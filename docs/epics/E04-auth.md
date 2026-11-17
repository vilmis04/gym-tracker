# E04 · Authentication & Profile

**Goal:** Users sign in with Google, get a profile automatically, and every DB request is authorized by RLS using their Clerk identity.
**Milestone:** M1 · Walking skeleton
**Depends on:** E01

---

### E04-T01 · Clerk with Google sign-in — `S`
Install Clerk, configure Google as the only sign-in method, add `<ClerkProvider>`, localized sign-in page (Clerk `lt-LT` / `en-US` localization), and middleware protecting the `(app)` area.

**Acceptance criteria**
- [ ] Unauthenticated users hitting app routes are redirected to sign-in
- [ ] Google sign-in works on desktop and mobile Safari/Chrome
- [ ] Sign-in UI uses design tokens (Clerk `appearance`) and active locale

**Depends on:** E01-T01, E03-T01

### E04-T02 · Clerk ↔ Supabase integration — `S`
Register Clerk as a third-party auth provider in Supabase (local, staging, prod). Pass Clerk session token in Supabase clients. Add a SQL helper `uid()` returning `auth.jwt()->>'sub'`.

**Acceptance criteria**
- [ ] A test query with RLS `using (owner = uid())` returns only the signed-in user's rows
- [ ] Requests without a token get no rows from protected tables

**Depends on:** E04-T01, E01-T03

### E04-T03 · Profiles table & sync — `M`
Migration for `profiles` with RLS. Clerk webhook (`user.created`, `user.updated`, `user.deleted`) verified with Svix, upserting profile data with the service-role key. Fallback upsert on first authenticated request.

**Acceptance criteria**
- [ ] New user has a profile within seconds of first login
- [ ] Name/avatar changes in Google/Clerk propagate
- [ ] `user.deleted` removes personal data (see E10-T05 for full deletion rules)
- [ ] Webhook rejects unsigned/invalid payloads

**Depends on:** E04-T02

### E04-T04 · Settings page — `S`
Page showing profile (name, avatar, email from Google — read-only), preferred language, theme. Saves to `profiles`. Sign out.

**Acceptance criteria**
- [ ] Changing language/theme applies immediately and persists across devices
- [ ] Sign out returns to landing page

**Depends on:** E04-T03, E02-T02

### E04-T05 · Public landing page — `S`
Minimal landing page: app name, one-line value proposition, "Continue with Google" button, language switch. Signed-in users are redirected to Home.

**Acceptance criteria**
- [ ] Renders in both locales and themes
- [ ] Lighthouse performance and accessibility ≥ 90 on mobile

**Depends on:** E04-T01, E02-T03
