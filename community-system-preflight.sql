/*
  COMMUNITY SYSTEM — ONE-TIME PREFLIGHT

  Run this file FIRST, by itself, in Supabase SQL Editor.
  Wait until it succeeds/commits, then run community-system.sql.

  Why this exists:
  The existing profiles.role column uses PostgreSQL enum user_role.
  PostgreSQL enum values added with ALTER TYPE are not safely usable by
  the same transaction in which they were added. Supabase SQL Editor may
  wrap a submitted script in one transaction, which caused 22P02 when the
  migration tried to use role='owner'.

  This preflight removes that dependency completely by converting the
  application role column to text and preserving the existing values.
*/

begin;

alter table public.profiles
  alter column role type text
  using role::text;

do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid=con.conrelid
    join pg_namespace nsp on nsp.oid=rel.relnamespace
    where nsp.nspname='public'
      and rel.relname='profiles'
      and con.contype='c'
      and pg_get_constraintdef(con.oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint if exists %I',c.conname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check(role in('reader','admin','owner'));

commit;
