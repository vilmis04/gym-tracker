# lib

- `supabase/` — Supabase client helpers: `server.ts` (`createServerClient`), `client.ts` (`createBrowserClient`), `admin.ts` (`createAdminClient`, service role, server only); see README → Supabase clients (E01-T03)
- `result.ts`, `errors.ts` — `Result<T>`, `ok()`/`fail()`, `ErrorCode`, `errorMessageKey`, `AppError` (E01-T07)
- `actions/` — `withAction()` Server Action wrapper (zod validation, error mapping, reporting); README → Server Actions and errors
- `sentry/` — shared Sentry options and PII scrubbing (`beforeSend`); README → Error tracking
- `i18n/` — next-intl setup (E03-T01): `locales.ts` (`LOCALES`, `DEFAULT_LOCALE` `lt`, `localeSchema`, `LOCALE_NATIVE_NAMES`, `LOCALE_COOKIE_NAME` / `LOCALE_COOKIE_MAX_AGE_SECONDS`), `routing.ts` (`routing`, next-intl `defineRouting`, used by `src/proxy.ts`), `navigation.ts` (E03-T02: next-intl `createNavigation(routing)` → `usePathname()` without the locale, `useRouter()` whose `replace(path, { locale })` also writes the `NEXT_LOCALE` cookie), `request.ts` (next-intl request config: locale from the `[locale]` root param, messages; wired in `next.config.ts`), `messages.ts` (`MESSAGES` per locale, typed against `en.json`), types in `i18n.types.ts`; the `AppConfig` augmentation is `src/global.d.ts`. Translate with `getTranslations` (`next-intl/server`) / `useTranslations` (`next-intl`); README → Translations
- `tags/` — auto-tag rules
- `utils/` — small framework-agnostic helpers: `cn.ts` (`cn()`, merges Tailwind class names; E02-T03); `normalize-search-text.ts` (E02-T04): `normalizeSearchText()` — the canonical trimmed, lowercase, accent-free form for exact-match comparisons (mirrors the database's `lower(f_unaccent(trim(name)))` for Lithuanian/Latin letters) — and `findMatchRanges()` for accent-insensitive match highlighting
- `dev-pages.ts` — `isDevPagesEnabled()`, the gate for developer-only `/dev` pages (E02-T01)
