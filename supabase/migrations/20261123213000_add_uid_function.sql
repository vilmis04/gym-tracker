-- E04-T02: `uid()`, the signed-in user's Clerk id, for every RLS policy.
--
-- Clerk is a Supabase third-party auth provider, so the request's JWT is the
-- Clerk session token and its `sub` claim is the Clerk user id (`user_…`,
-- text). Supabase's own `auth.uid()` casts `sub` to uuid and fails on Clerk
-- ids, so policies must use this helper instead:
--
--   using (owner_id = (select uid()))
--
-- The `(select …)` wrapper lets Postgres evaluate it once per statement
-- instead of once per row (Supabase RLS performance guide).
--
-- Returns null without a token or claim (anon key, service role), so a
-- comparison with it never matches a row.
--
-- `stable`: constant within a statement, so the planner may cache it.
-- `security invoker` (the default) and an empty search_path: it only reads
-- the caller's own JWT claims, schema-qualified.

create or replace function public.uid()
returns text
language sql
stable
set search_path = ''
as $$
  select auth.jwt() ->> 'sub'
$$;

comment on function public.uid() is
  'Clerk user id of the request (JWT sub claim), or null when signed out. Use in RLS policies as (select uid()); never auth.uid(), which casts to uuid.';
