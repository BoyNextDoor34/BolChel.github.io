-- One-time repair for the existing owner role-management RPC.
-- Run this in Supabase SQL Editor, then refresh the site.

create or replace function public.community_set_role(p_user_id uuid,p_role text)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  old_role text;
  new_role public.user_role;
  trigger_name text;
  enabled_trigger_names text[] := array[]::text[];
begin
  if (select auth.uid()) is null then
    raise exception 'Требуется авторизация.';
  end if;

  if (select public.community_current_role()) <> 'owner' then
    raise exception 'Назначать администраторов может только владелец.';
  end if;

  if p_role not in ('reader','admin') then
    raise exception 'Можно назначить только reader или admin.';
  end if;

  new_role := p_role::public.user_role;

  select p.role::text into old_role
  from public.profiles p
  where p.id = p_user_id;

  if old_role is null then
    raise exception 'Пользователь не найден.';
  end if;

  if old_role = 'owner' then
    raise exception 'Роль владельца нельзя изменить.';
  end if;

  for trigger_name in
    select t.tgname
    from pg_trigger t
    join pg_class r on r.oid=t.tgrelid
    join pg_proc f on f.oid=t.tgfoid
    join pg_namespace n on n.oid=f.pronamespace
    where r.oid='public.profiles'::regclass
      and not t.tgisinternal
      and n.nspname='public'
      and f.proname='prevent_role_change'
      and t.tgenabled<>'D'
  loop
    enabled_trigger_names := array_append(enabled_trigger_names,trigger_name);
    execute format('alter table public.profiles disable trigger %I',trigger_name);
  end loop;

  begin
    update public.profiles
    set role = new_role
    where id = p_user_id;
  exception when others then
    foreach trigger_name in array enabled_trigger_names loop
      execute format('alter table public.profiles enable trigger %I',trigger_name);
    end loop;
    raise;
  end;

  foreach trigger_name in array enabled_trigger_names loop
    execute format('alter table public.profiles enable trigger %I',trigger_name);
  end loop;

  return true;
end
$$;

revoke all on function public.community_set_role(uuid,text) from public;
grant execute on function public.community_set_role(uuid,text) to authenticated;

notify pgrst, 'reload schema';
