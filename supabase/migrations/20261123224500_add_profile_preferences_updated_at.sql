-- E04-T04: `profiles.preferences_updated_at`, when the user last saved their
-- language or theme (null = never).
--
-- After signing in on a device, the app applies the saved `locale` / `theme`
-- (`ApplySavedPreferences`). A brand-new profile only holds the column
-- defaults (`lt`, `system`), which are not a choice: applying them would undo
-- the language a new user just picked on the landing page. So while this is
-- null the device's current choice is saved instead.
--
-- Set by a trigger whenever an update lists `locale` or `theme` in its SET
-- clause (also when the value stays the same: picking the default is a
-- choice too). The Clerk sync never lists them, and users can't write the
-- column (their column grant is `locale`, `theme` only).
--
-- Idempotent: every statement can run again on a database that has it.

alter table public.profiles
  add column if not exists preferences_updated_at timestamptz;

comment on column public.profiles.preferences_updated_at is
  'When the user last saved locale or theme; null = never (the values are the column defaults). Set by the profiles_set_preferences_updated_at trigger.';

create or replace function public.set_preferences_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.preferences_updated_at := now();
  return new;
end;
$$;

comment on function public.set_preferences_updated_at() is
  'Trigger function: sets preferences_updated_at = now(). Used by a BEFORE UPDATE OF locale, theme trigger on profiles.';

drop trigger if exists profiles_set_preferences_updated_at on public.profiles;
create trigger profiles_set_preferences_updated_at
  before update of locale, theme on public.profiles
  for each row execute function public.set_preferences_updated_at();
