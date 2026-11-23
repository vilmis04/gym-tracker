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

**Already in place (E03-T01):** the one Proxy is `src/proxy.ts` (Next.js 16's name for middleware; `middleware.ts` is deprecated). It exports `proxy()`, which calls next-intl's `handleLocaleRouting`; replace that export with `clerkMiddleware(async (auth, request) => { … return handleLocaleRouting(request); })` and add Clerk's API matcher (see the `TODO(E04-T01)` there). There are two root layouts: `app/[locale]/layout.tsx` (all localized pages; put `<ClerkProvider>` there, the locale is its `params.locale` / `getLocale()`) and `app/(developer-tools)/layout.tsx` (`/dev`, `/debug`, no Clerk needed). `auth.signIn` / `auth.signOut` messages exist. **E03-T02:** the `TODO(E04-T01)` in `app/[locale]/layout.tsx` marks where `<ClerkProvider localization>` goes (`ltLT` / `enUS` from `locale`); the language switch changes that layout's `locale` param, so Clerk's components follow it — add an e2e check that `<SignIn />` and the user menu change language with the switch (E03-T02's last acceptance criterion).

**Acceptance criteria**
- [ ] Opening `/lt/sessions` while signed out redirects to sign-in, then back to `/lt/sessions` after Google login. — The redirect to `/lt/sign-in?redirect_url=…/lt/sessions` is verified (unit tests with and without Clerk, e2e without keys). The way back is Clerk's `redirect_url` handling, covered by the gated e2e `returns to the page that asked for sign-in` (a sign-in ticket completed by `<SignIn />`); not run yet: no Clerk dev keys in the agent sandbox / CI.
- [ ] Only the "Continue with Google" option is visible. — A Clerk dashboard setting (deployment.md → Clerk); checked by the gated e2e `offers only Continue with Google`, not run yet.
- [ ] Sign-in works on desktop Chrome, Android Chrome and iOS Safari. — Needs a real Google sign-in on the devices (manual, on a preview); not done. The gated e2e runs in Chromium and WebKit (iPhone 14).
- [ ] Sign-in UI is in Lithuanian under `/lt` and English under `/en`, and matches the light/dark theme. — Implemented (`CLERK_LOCALIZATIONS`, `CLERK_APPEARANCE` with the CSS tokens; unit-tested); the gated e2e checks both languages, the switch and the dark card, not run yet.
- [ ] Signing out clears the session and returns to the landing page. — Unit-tested (`signOut({ redirectUrl: "/lt" })` from the avatar menu); the gated e2e also checks that the session is gone, not run yet.

**Done (E04-T01):** `@clerk/nextjs` 7.9.25 (released 2026-11-05) with its `@clerk/backend` 3.27.0 / `@clerk/react` 6.18.6 / `@clerk/shared` 4.44.1 pinned through `overrides` (the caret ranges would pull releases younger than two weeks), `@clerk/testing` moved to 2.2.55 from the same release (2.3.1 needed a newer `@clerk/shared`), `@clerk/backend` as a dev dependency for the e2e sign-in tickets.
- **Proxy** (`src/proxy.ts`): `proxy()` runs `clerkMiddleware` around next-intl's `handleLocaleRouting` (one Proxy), with `/api/:path*` added to the matcher; API routes skip the locale step. `isProtectedPath()` (`src/lib/auth/auth-routes.ts`) protects `/{locale}/{section}/…` for every folder of `app/[locale]/(app)/` (a unit test reads the folders, so a new section can't be forgotten; percent-encoded segments are decoded, malformed ones are refused) and every API route except `/api/health` and `/api/webhooks/*`. Signed out, `auth.protect()` redirects pages to `/{locale}/sign-in?redirect_url=<URL>` (sign-in URL per request from the path's locale) and answers 404 for API routes. URLs without a locale are localized first, then checked. The landing page, sign-in, the localized 404 and `/dev`, `/debug` stay public.
- **Without Clerk keys** (`isClerkConfigured()`, `src/lib/auth/clerk-env.ts`: a zod-checked `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, inlined at build) the app still builds and serves public pages and `/api/health` (CI's build, Docker and e2e jobs have no keys), but fails closed: the proxy gives protected pages the same redirect to sign-in (and API routes the same 404) without calling Clerk, `AuthProvider` renders no `<ClerkProvider>`, and the sign-in page says "Sign-in isn't available right now".
- **Provider** (`src/components/common/auth/auth-provider.tsx`, in `app/[locale]/layout.tsx`): `<ClerkProvider>` with `localization` from the URL's locale, `appearance` (`src/lib/auth/clerk-appearance.ts`: Clerk variables set to `var(--primary)`, `var(--card)`, … so the card follows light/dark without JS; no shadow; 12 px radius; Inter inherited), `signInUrl` / `signUpUrl` `/{locale}/sign-in`, after sign-in/up Home (`/{locale}/dashboard`) unless `redirect_url` says otherwise, after sign-out the landing page. `ClerkAccountProvider` turns Clerk's user into `AccountContext` (`useAccount()`: name, email, photo or `null` → initials, `signOut(redirectUrl)`), so app components never call Clerk hooks and render without Clerk (no-key builds, unit tests).
- **Lithuanian:** Clerk has no `ltLT` (`@clerk/localizations` 4.26 ships ~50 locales, not Lithuanian), so `src/lib/auth/clerk-localizations.ts` translates the strings of the Google-only sign-in-or-up flow (Continue with Google, titles, account switcher, errors such as `oauth_access_denied`); other keys fall back to Clerk's English. English uses Clerk's built-in text (`{ locale: "en-US" }`), not the ~100 kB `enUS` object.
- **Sign-in page** `app/[locale]/(public)/sign-in/[[...signIn]]/page.tsx` (`SignInPage`, title "Prisijungti · Gym Tracker"): `<SignIn path routing="path" withSignUp />` (one sign-in-or-up flow: the first Google sign-in creates the account; no sign-up page), plus the `LanguageSwitcher` and `ThemeToggle` as on the landing page. The landing placeholder links to it ("Sign in"; E04-T05 replaces it with "Continue with Google").
- **Avatar menu** (`AccountMenu`): the button shows the user's `<Avatar size="lg">` (Google photo, or initials on a pastel fill; the user icon until Clerk has loaded), the menu starts with the name and email, and **Sign out** is the last item (disabled until the user is loaded) → `signOut({ redirectUrl: "/{locale}" })`.
- `(app)/layout.tsx` has no auth check on purpose (a layout doesn't re-run on client navigation, Next.js authentication guide); data is checked where it's read (RLS, E04-T02). The `TODO(E04-T01)` markers are resolved.
- **Tests.** Unit: `auth-routes.test.ts`, `clerk-env.test.ts`, `clerk-localizations.test.ts`, `auth-provider.test.tsx`, `clerk-account-provider.test.tsx` (Clerk mocked with `tests/helpers/clerk-mock.ts`), `account-menu.test.tsx` (avatar, name/email, sign out, disabled while loading; `<AccountContext value>`), `proxy.test.ts` (no keys) and `proxy.clerk.test.ts` (real `clerkMiddleware` with a fake production-style key: signed-out redirects, API 404, public routes; no network). E2E `tests/e2e/sign-in.spec.ts`: always — redirect with `redirect_url` in both locales, landing → sign-in, the "not available" page without keys; with Clerk keys — the sign-in helper, only Google in LT and EN with the language switch (E03-T02's last criterion), the way back via `redirect_url`, the dark card, the avatar menu following the language switch and signing out. `app-layout.spec.ts` and the avatar-menu test in `language-switcher.spec.ts` now sign in first (`signInBeforeEachTest()`), so they are skipped without keys; the `/de/dashboard` 404 check moved to `locale-routing.spec.ts`.
- **Deviations:** sign-in URLs are set in code per locale (props, middleware option), not with `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (one value can't be both `/lt/sign-in` and `/en/sign-in`). After sign-in the fallback is `/{locale}/dashboard` (the Home route) rather than `/{locale}`, which stays the landing page until E04-T05. No design exists for sign-in (canvas and ui-mockups.md have none); it follows the landing page pattern. The Lithuanian Clerk text is ours and partial (see above).

**Already in place (E04-T01) for later tasks:** `auth()` / `currentUser()` from `@clerk/nextjs/server` work in Server Components, Server Actions and every route handler (the proxy runs on all of `/api`). Protect a new API route by default (`isProtectedPath`); add public ones there (webhooks are already public). The browser's `window.Clerk` and `useClerk()` are available under `ClerkAccountProvider`. App components read the user with `useAccount()` (`src/components/common/auth/account-context.ts`); extend `Account` / `ClerkAccountProvider` rather than calling Clerk hooks in components. In unit tests mock Clerk per file with `vi.mock("@clerk/nextjs", () => import("@tests/helpers/clerk-mock"))` (`mockSignedInUser()`, `signOut` spy); e2e specs of signed-in pages call `signInBeforeEachTest()`.

**Depends on:** E01-T01, E03-T01

### E04-T02 · Clerk ↔ Supabase integration — `S`
**Why:** Supabase must know who the user is on every request, so RLS can enforce privacy in the database rather than in app code only.

**Scope**
- Add Clerk as a **third-party auth provider** in Supabase (local `config.toml`, staging, production) and activate the Supabase integration in Clerk.
- Supabase clients (E01-T03) pass `accessToken: async () => (await auth()).getToken()` on the server and `session.getToken()` in the browser.
- SQL helper `uid()` returning `auth.jwt()->>'sub'` (`stable`), used by all RLS policies.
- Local development: RLS test helper signs equivalent JWTs (E01-T04).

**Out of scope:** Profile sync (E04-T03).

**Already in place (E04-T01):** Clerk runs in the proxy for every page and API route, so `auth()` from `@clerk/nextjs/server` works in the server client (`src/lib/supabase/server.ts`: `accessToken: async () => (await auth()).getToken()`); in the browser `useClerk().session?.getToken()` / `window.Clerk.session.getToken()` is available below `ClerkAccountProvider`. `isClerkConfigured()` (`src/lib/auth/clerk-env.ts`) is false in CI's no-key jobs: keep the signed-out stub there. RLS test JWTs (`tests/helpers/supabase-auth.ts`) already carry `sub` = a Clerk-style user id; the real Clerk session token needs the Supabase integration activated in the Clerk dashboard (it adds `role: authenticated`).

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

**Already in place (E04-T01):** `/api/webhooks/*` is public in `isProtectedPath()` (`src/lib/auth/auth-routes.ts`) and still passes through `clerkMiddleware` (signed out, no locale step), so the route only has to verify the Svix signature (`verifyWebhook` from `@clerk/nextjs/webhooks`, `CLERK_WEBHOOK_SIGNING_SECRET`). `currentUser()` from `@clerk/nextjs/server` works in Server Components for the first-request fallback; the avatar menu already shows Clerk's name, email and photo (`ClerkAccountProvider`), which the profile could replace or feed.

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

**Already in place (E03-T02):** switching language (avatar menu, landing page) goes through `useLocaleSwitch({ onLocaleChange })` in `src/components/common/language/`, which keeps path and query and writes the `NEXT_LOCALE` cookie; `LanguageSwitcher` takes the same `onLocaleChange`. To finish E03-T02: (1) a Server Action that validates the locale with `localeSchema` and updates `profiles.locale`, passed as `onLocaleChange` in `AccountMenu` (`TODO(E04-T04)` there; signed-in only) and to the `LanguageSwitcher` on this settings page; (2) on sign-in, if `profiles.locale` differs from the URL, set `NEXT_LOCALE` to it and redirect to the same path in the saved locale (see the `TODO(E04-T04)` in `src/proxy.ts`; the cookie then carries it on that device). Theme works the same way through `onThemePreferenceChange`. E03-T02's "after switching to EN on phone, signing in on desktop opens the app in EN" is verified here.

**Out of scope:** Data export and deletion (E10-T05).

**Already in place (E04-T01):** Sign out is in the avatar menu (`AccountMenu`, `useAccount().signOut(getLandingPath(locale))`); reuse `useAccount()` (`src/components/common/auth/account-context.ts`) for the settings page's sign-out button and account section (name, email, photo; `Avatar`). Clerk's account management can be opened with `useClerk().openUserProfile()` or a `<UserProfile />` route; its Lithuanian strings are not in `CLERK_LOCALIZATIONS` yet (only the sign-in flow is), so add the `userProfile` keys used there. The settings page is protected (`isProtectedPath`). No mock-up exists for it (design notes in the E04 design extraction).

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

**Already in place (E04-T01):** the placeholder landing page has a "Sign in" link to `/{locale}/sign-in` (replace it). For one-tap Google, use Clerk Core 3's `useSignIn()` (`signIn.sso({ strategy: "oauth_google", redirectUrl: … })`, see `@clerk/shared` types `signInFuture`; the classic `authenticateWithRedirect` still exists) with the callback on the sign-in route, whose catch-all already serves `/{locale}/sign-in/sso-callback`, or `<SignInButton>`; read `auth()` in the page (or redirect signed-in users in the proxy) to send them to Home, which makes `/{locale}` dynamic. `/{locale}` is public in `isProtectedPath`. Without Clerk keys the button must degrade (`isClerkConfigured()`).

**Acceptance criteria**
- [ ] Signed-out visitors see the landing page; signed-in users are sent to Home.
- [ ] "Continue with Google" starts Google sign-in directly (one tap).
- [ ] All text is translated; layout works in both themes and at 360 px.
- [ ] Lighthouse mobile scores ≥ 90 for performance and accessibility.

**Depends on:** E04-T01, E02-T03
