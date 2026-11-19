# lib

- `supabase/` — Supabase client helpers: `server.ts` (`createServerClient`), `client.ts` (`createBrowserClient`), `admin.ts` (`createAdminClient`, service role, server only); see README → Supabase clients (E01-T03)
- `result.ts`, `errors.ts` — `Result<T>`, `ok()`/`fail()`, `ErrorCode`, `errorMessageKey`, `AppError` (E01-T07)
- `actions/` — `withAction()` Server Action wrapper (zod validation, error mapping, reporting); README → Server Actions and errors
- `sentry/` — shared Sentry options and PII scrubbing (`beforeSend`); README → Error tracking
- `i18n/` — next-intl setup (E03)
- `tags/` — auto-tag rules
- `utils/` — small framework-agnostic helpers: `cn.ts` (`cn()`, merges Tailwind class names; E02-T03)
- `dev-pages.ts` — `isDevPagesEnabled()`, the gate for developer-only `/dev` pages (E02-T01)
