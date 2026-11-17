-- E01-T02: search extensions used by exercise/machine name matching.
--
-- * pg_trgm  — trigram GIN indexes for fuzzy autocomplete (e.g. on
--              exercises.name_normalized). Opclass: extensions.gin_trgm_ops.
-- * unaccent — strips diacritics so "Ąžuolas" matches "azuolas".
--
-- Supabase keeps extensions in the `extensions` schema, so everything below is
-- schema-qualified.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- `unaccent()` is only STABLE (its result depends on search_path and the
-- dictionary), so Postgres refuses it in generated columns and index
-- expressions. This wrapper pins the dictionary by schema-qualified name and
-- an empty search_path, which makes it safe to declare IMMUTABLE.
create or replace function public.f_unaccent(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, value)
$$;

comment on function public.f_unaccent(text) is
  'Immutable unaccent wrapper for generated columns and indexes, e.g. lower(f_unaccent(trim(name))).';
