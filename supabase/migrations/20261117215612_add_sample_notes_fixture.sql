-- E01-T03: DEV/TEST FIXTURE — not part of the product schema.
--
-- `public.sample_notes` exists only so the foundation tasks have a real table
-- to point at before any feature tables land:
--   * E01-T03 proves typed queries through `createServerClient()`
--     (src/lib/supabase/__typetests__/server-client.typetest.tsx).
--   * E01-T04 reuses it for the example RLS test ("user B cannot read user A's
--     row").
--
-- It shows the RLS pattern every real table follows: the owner is the Clerk
-- user id from the JWT `sub` claim (text), and policies wrap `auth.jwt()` in
-- `(select …)` so Postgres evaluates it once per statement instead of per row.
--
-- TODO(drop): remove in a new migration once real tables have their own RLS
-- tests (at the latest with E04-T03 `profiles`); also delete the type test and
-- the example RLS test that use it. Tracked in docs/data-model.md → Dev/test
-- fixtures.

create table public.sample_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null default (auth.jwt() ->> 'sub'),
  body text not null,
  created_at timestamptz not null default now()
);

comment on table public.sample_notes is
  'DEV/TEST FIXTURE (E01-T03/T04): owner-only notes used by type and RLS example tests. Drop once real tables have RLS tests.';

create index sample_notes_owner_id_idx on public.sample_notes (owner_id);

alter table public.sample_notes enable row level security;

-- Only signed-in users (Clerk token → `authenticated` role) get any access;
-- `anon` has no policy, so RLS denies it everything.
create policy "sample_notes: owners can read their notes"
  on public.sample_notes for select
  to authenticated
  using ((select auth.jwt() ->> 'sub') = owner_id);

create policy "sample_notes: owners can insert their notes"
  on public.sample_notes for insert
  to authenticated
  with check ((select auth.jwt() ->> 'sub') = owner_id);

create policy "sample_notes: owners can update their notes"
  on public.sample_notes for update
  to authenticated
  using ((select auth.jwt() ->> 'sub') = owner_id)
  with check ((select auth.jwt() ->> 'sub') = owner_id);

create policy "sample_notes: owners can delete their notes"
  on public.sample_notes for delete
  to authenticated
  using ((select auth.jwt() ->> 'sub') = owner_id);
