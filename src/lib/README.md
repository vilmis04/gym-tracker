# lib

- `supabase/` — Supabase client helpers: `server.ts` (`createServerClient`), `client.ts` (`createBrowserClient`), `admin.ts` (`createAdminClient`, service role, server only); see README → Supabase clients (E01-T03)
- `result.ts`, `errors.ts` — `Result<T>`, `ok()`/`fail()`, `ErrorCode`, `errorMessageKey`, `AppError` (E01-T07)
- `actions/` — `withAction()` Server Action wrapper (zod validation, error mapping, reporting); README → Server Actions and errors
- `sentry/` — shared Sentry options and PII scrubbing (`beforeSend`); README → Error tracking
- `i18n/` — locales and messages (E02-T06, interim until next-intl in E03): `locales.ts` (`LOCALES`, `DEFAULT_LOCALE` `lt`, `localeSchema`, `LOCALE_NATIVE_NAMES`, `getLocalizedPathname()`), `locale-param.ts` (`getLocaleParam(params)`: validated `[locale]` or 404), `messages.ts` (`getTranslations({ locale, namespace })` for Server Components), `use-translations.ts` (`useLocale()`, `useTranslations(namespace)` for client components), types in `i18n.types.ts`; README → Translations (interim)
- `tags/` — auto-tag rules
- `utils/` — small framework-agnostic helpers: `cn.ts` (`cn()`, merges Tailwind class names; E02-T03); `normalize-search-text.ts` (E02-T04): `normalizeSearchText()` — the canonical trimmed, lowercase, accent-free form for exact-match comparisons (mirrors the database's `lower(f_unaccent(trim(name)))` for Lithuanian/Latin letters) — and `findMatchRanges()` for accent-insensitive match highlighting
- `dev-pages.ts` — `isDevPagesEnabled()`, the gate for developer-only `/dev` pages (E02-T01)
