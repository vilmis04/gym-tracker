# E04 · Authentication & Profile

**Goal:** Users sign in with Google, get a profile automatically, and every DB request is authorized by RLS using their Clerk identity.
**Milestone:** M1 · Walking skeleton
**Depends on:** E01

---

### E04-T01 · Clerk with Google sign-in — `S`
**Why:** Google login is the only sign-in method required; it removes passwords and makes joining a friend's session quick.

**Scope**
- Clerk application (dev instance) with **Google** as the only enabled method; email/password and other providers disabled.
- `<ClerkProvider>` in the root layout with `localization` set from the active locale (`ltLT` / `enUS`) and `appearance` using design tokens.
- Sign-in page `/[locale]/sign-in` with Clerk `<SignIn />`; after sign-in redirect to `/[locale]` Home, or to the originally requested URL.
- Middleware protects every route in `(app)`; public: landing, sign-in, `/api/webhooks/*`.
- Sign out from the avatar menu.

**Out of scope:** Profile table (E04-T03).

**Acceptance criteria**
- [ ] Opening `/lt/sessions` while signed out redirects to sign-in, then back to `/lt/sessions` after Google login.
- [ ] Only the "Continue with Google" option is visible.
- [ ] Sign-in works on desktop Chrome, Android Chrome and iOS Safari.
- [ ] Sign-in UI is in Lithuanian under `/lt` and English under `/en`, and matches the light/dark theme.
- [ ] Signing out clears the session and returns to the landing page.

**Depends on:** E01-T01, E03-T01

### E04-T02 · Clerk ↔ Supabase integration — `S`
**Why:** Supabase must know who the user is on every request, so RLS can enforce privacy in the database rather than in app code only.

**Scope**
- Add Clerk as a **third-party auth provider** in Supabase (local `config.toml`, staging, production) and activate the Supabase integration in Clerk.
- Supabase clients (E01-T03) pass `accessToken: async () => (await auth()).getToken()` on the server and `session.getToken()` in the browser.
- SQL helper `uid()` returning `auth.jwt()->>'sub'` (`stable`), used by all RLS policies.
- Local development: RLS test helper signs equivalent JWTs (E01-T04).

**Out of scope:** Profile sync (E04-T03).

**Acceptance criteria**
- [ ] With a test table protected by `using (owner_id = uid())`, a signed-in user reads only their own rows.
- [ ] A request without a token (anonymous) gets zero rows from protected tables and cannot insert.
- [ ] A forged or expired token is rejected by Supabase.
- [ ] Works the same in local, preview and production environments.

**Depends on:** E04-T01, E01-T03

### E04-T03 · Profiles table & sync — `M`
**Why:** Other users need to see a name and avatar (buddies, sessions), and the app needs to store preferences such as language and theme.

**Scope**
- Migration for `profiles` (see [data-model.md](../data-model.md#profiles)) with RLS: users can read and update their own profile; visibility to buddies and co-participants is added in E05-T01 / E07-T01.
- Users may update only `locale` and `theme`; `display_name`, `email`, `avatar_url` come from Clerk.
- Route `/api/webhooks/clerk` handling `user.created`, `user.updated`, `user.deleted`, verified with the Svix signature, writing via the service-role client.
- Fallback: on the first authenticated request, if no profile exists, create it from Clerk's `currentUser()`.
- Webhook is idempotent (repeated events give the same result).

**Out of scope:** Full GDPR deletion of related data (E10-T05).

**Acceptance criteria**
- [ ] A brand-new Google user has a `profiles` row within 5 seconds of first sign-in, even if the webhook is delayed.
- [ ] Changing the Google account name/photo updates `display_name`/`avatar_url` after the next `user.updated` event.
- [ ] A request with a missing or invalid Svix signature returns 401 and changes nothing.
- [ ] Replaying the same webhook event twice doesn't create duplicates or errors.
- [ ] RLS tests: user A cannot read or update user B's profile (before they are buddies).
- [ ] A user cannot change their own `email` or `display_name` through the API.

**Depends on:** E04-T02

### E04-T04 · Settings page — `S`
**Why:** Users need one place to see their account and set language and theme preferences that follow them across devices.

**Scope**
- `/[locale]/settings` with sections:
  - **Account:** avatar, name, email (read-only, "Managed by Google"), link to Clerk's account management.
  - **Preferences:** language (LT/EN), theme (light/dark/system).
  - **Sign out.**
  - Placeholder for "Export data" and "Delete account" (filled in E10-T05).
- Saving preferences via a Server Action updating `profiles`; changes apply immediately.
- On sign-in on a new device, `profiles.theme` and `profiles.locale` are applied.

**Out of scope:** Data export and deletion (E10-T05).

**Acceptance criteria**
- [ ] Changing theme or language applies instantly and shows a short "Saved" confirmation.
- [ ] Preferences set on one device are applied when signing in on another.
- [ ] Email and name are visible but cannot be edited.
- [ ] Page works in both locales and themes and at 360 px width.

**Depends on:** E04-T03, E02-T02

### E04-T05 · Public landing page — `S`
**Why:** The first screen for new users should explain the app in one glance and make signing in a single tap.

**Scope**
- `/[locale]` for signed-out users: app name/logo, one-line value proposition, 3 short benefit points (train with buddies, last attempt pre-filled, see progress), "Continue with Google" button, language switch and theme toggle.
- Signed-in users visiting `/[locale]` see Home instead.
- Basic SEO: title, description, Open Graph image (earth-tone), per locale.

**Out of scope:** Marketing site, blog, pricing.

**Acceptance criteria**
- [ ] Signed-out visitors see the landing page; signed-in users are sent to Home.
- [ ] "Continue with Google" starts Google sign-in directly (one tap).
- [ ] All text is translated; layout works in both themes and at 360 px.
- [ ] Lighthouse mobile scores ≥ 90 for performance and accessibility.

**Depends on:** E04-T01, E02-T03
