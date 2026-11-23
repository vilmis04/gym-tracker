-- E04-T03: `profiles`, one row per Clerk user, kept in sync with Clerk.
--
-- Clerk owns the identity (name, email, photo): the Clerk webhook
-- (`/api/webhooks/clerk`, service role) and the first-request fallback
-- (`getCurrentProfile()`) write it through `sync_profile_from_clerk()`. Users
-- only read their own row and change their preferences (`locale`, `theme`).
-- Buddies and session co-participants get read access in E05-T01 / E07-T01.
--
-- Idempotent: every statement can run again on a database that has it.

-- The E01-T03 dev fixture is replaced by a real table with RLS tests
-- (docs/data-model.md → Dev/test fixtures).
drop table if exists public.sample_notes;

-- Shared trigger function: `updated_at` is the time of the last change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger function: sets updated_at = now() on every update. Reuse with a BEFORE UPDATE trigger.';

create table if not exists public.profiles (
  -- Clerk user id (`user_…`), the JWT `sub` claim; `uid()` in policies.
  id text primary key,
  display_name text not null check (btrim(display_name) <> ''),
  -- Stored canonical (trimmed, lowercase): buddy search matches it exactly.
  email text not null unique check (email = lower(btrim(email)) and email <> ''),
  -- Rendered as an image source, so only https URLs (Clerk's image CDN).
  avatar_url text check (avatar_url ~ '^https://'),
  -- Same values as LOCALES (src/lib/i18n/locales.ts) and THEME_PREFERENCES
  -- (src/components/common/theme/theme-preferences.ts).
  locale text not null default 'lt' check (locale in ('lt', 'en')),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  -- Random URL-safe code for buddy invite links (E05-T05): 96 random bits,
  -- 16 characters of base64url, e.g. "BH_3QjV5ihkxm2r5".
  invite_code text not null unique
    default translate(encode(extensions.gen_random_bytes(12), 'base64'), '+/', '-_'),
  -- Clerk's `updated_at` of the data last written: an older Clerk event
  -- (webhooks may arrive out of order) never overwrites newer data.
  clerk_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per Clerk user. Identity columns are synced from Clerk (webhook + first-request fallback); users may update only locale and theme.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles: users can read their own profile" on public.profiles;
create policy "profiles: users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select public.uid()));

drop policy if exists "profiles: users can update their own profile" on public.profiles;
create policy "profiles: users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select public.uid()))
  with check (id = (select public.uid()));

-- No insert/delete policy: rows are created and removed only by the service
-- role. Supabase grants every table to anon/authenticated by default; narrow
-- that to what the policies need, and let users update only their
-- preferences (Postgres checks column privileges before RLS → 42501).
revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (locale, theme) on public.profiles to authenticated;

-- Ids of deleted Clerk users. Clerk never reuses ids, so a `user.created` /
-- `user.updated` event that arrives after `user.deleted` (retries are not
-- ordered) must not bring the profile back. Holds no personal data besides
-- the id. Service role only.
create table if not exists public.deleted_users (
  id text primary key,
  deleted_at timestamptz not null default now()
);

comment on table public.deleted_users is
  'Clerk user ids whose profile was deleted (user.deleted webhook); later Clerk events for them are ignored. Service role only.';

alter table public.deleted_users enable row level security;
revoke all on public.deleted_users from anon;
revoke all on public.deleted_users from authenticated;

-- Creates or updates a profile from Clerk data unless the stored data is as
-- new or newer (`clerk_updated_at`) or the user was deleted. Returns
-- 'synced', 'ignored_outdated' or 'ignored_deleted'. Normalizes the email
-- (trim + lowercase) and the name (trim). Preferences and invite code are
-- never touched. Replaying the same event returns 'ignored_outdated' and
-- changes nothing.
create or replace function public.sync_profile_from_clerk(
  incoming_id text,
  incoming_display_name text,
  incoming_email text,
  incoming_clerk_updated_at timestamptz,
  -- Clerk users without a photo have none; optional so generated types
  -- allow leaving it out.
  incoming_avatar_url text default null
)
returns text
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.deleted_users where id = incoming_id) then
    return 'ignored_deleted';
  end if;

  insert into public.profiles as profile
    (id, display_name, email, avatar_url, clerk_updated_at)
  values (
    incoming_id,
    btrim(incoming_display_name),
    lower(btrim(incoming_email)),
    incoming_avatar_url,
    incoming_clerk_updated_at
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        clerk_updated_at = excluded.clerk_updated_at
    where profile.clerk_updated_at < excluded.clerk_updated_at;

  if found then
    return 'synced';
  end if;
  return 'ignored_outdated';
end;
$$;

comment on function public.sync_profile_from_clerk(text, text, text, timestamptz, text) is
  'Service role only: upserts a profile from Clerk data unless it is outdated or the user was deleted. Returns synced | ignored_outdated | ignored_deleted.';

-- Deletes the profile and remembers the id (see deleted_users), in one
-- transaction. Deleting a missing profile is not an error (replays).
create or replace function public.delete_profile_from_clerk(incoming_id text)
returns void
language sql
set search_path = ''
as $$
  insert into public.deleted_users (id) values (incoming_id)
  on conflict (id) do nothing;
  delete from public.profiles where id = incoming_id;
$$;

comment on function public.delete_profile_from_clerk(text) is
  'Service role only: deletes a profile after user.deleted and records the id so later events for it are ignored.';

-- Functions are executable by PUBLIC (and Supabase adds anon/authenticated)
-- by default, which would expose them as RPCs to every user. The service
-- role keeps the execute grant Supabase's default privileges give it.
revoke execute on function public.sync_profile_from_clerk(text, text, text, timestamptz, text)
  from public, anon, authenticated;
revoke execute on function public.delete_profile_from_clerk(text)
  from public, anon, authenticated;
