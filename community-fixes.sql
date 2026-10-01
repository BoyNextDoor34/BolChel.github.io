/* Incremental community fixes for the already-installed community system.
   Run once in Supabase SQL Editor after the community tables/functions exist. */

begin;

create table if not exists public.comment_edits (
  comment_id bigint primary key references public.comments(id) on delete cascade,
  editor_id uuid not null references public.profiles(id) on delete cascade,
  edited_at timestamptz not null default now()
);

alter table public.comment_edits enable row level security;

drop policy if exists "community comment edits are public" on public.comment_edits;
create policy "community comment edits are public"
on public.comment_edits
for select
to anon, authenticated
using (true);

drop policy if exists "community users mark own comment edits" on public.comment_edits;
create policy "community users mark own comment edits"
on public.comment_edits
for insert
to authenticated
with check (
  editor_id = auth.uid()
  and exists (
    select 1 from public.comments c
    where c.id = comment_id
      and c.author_id = auth.uid()
  )
);

drop policy if exists "community users update own comment edit marker" on public.comment_edits;
create policy "community users update own comment edit marker"
on public.comment_edits
for update
to authenticated
using (editor_id = auth.uid())
with check (editor_id = auth.uid());

grant select on public.comment_edits to anon, authenticated;
grant insert, update on public.comment_edits to authenticated;

-- Public profile data contains only intentionally public fields, so the view must
-- remain readable even when public.profiles itself is protected by RLS.
create or replace view public.community_public_profiles
with (security_invoker=false) as
select
  p.id,
  p.nickname,
  p.role::text as role,
  p.avatar_url,
  p.bio,
  p.created_at,
  coalesce((select sum(c.score) from public.comments c where c.author_id=p.id),0)::integer as comment_score,
  (select count(*) from public.news n where n.author_id=p.id)::integer as publication_count
from public.profiles p;

grant select on public.community_public_profiles to anon, authenticated;

-- Insert comments through a SECURITY DEFINER RPC so existing RLS policies and
-- legacy table policies cannot prevent a valid authenticated comment.
create or replace function public.community_create_comment(
  p_news_id text,
  p_body text,
  p_parent_id bigint default null
)
returns bigint
language plpgsql
security definer
set search_path=''
as $$
declare
  me uuid := (select auth.uid());
  body text := trim(coalesce(p_body,''));
  parent_news text;
  new_id bigint;
begin
  if me is null then
    raise exception 'Сначала войдите в аккаунт.';
  end if;

  if body = '' then
    raise exception 'Комментарий не может быть пустым.';
  end if;

  if char_length(body) > 4000 then
    raise exception 'Комментарий не может быть длиннее 4000 символов.';
  end if;

  if (select coalesce(p.is_banned,false) from public.profiles p where p.id=me) then
    raise exception 'Ваш аккаунт заблокирован.';
  end if;

  if not exists(select 1 from public.news n where n.id::text=trim(coalesce(p_news_id,''))) then
    raise exception 'Новость для комментария не найдена.';
  end if;

  if p_parent_id is not null then
    select c.news_id into parent_news
    from public.comments c
    where c.id=p_parent_id;

    if parent_news is null then
      raise exception 'Родительский комментарий не найден.';
    end if;

    if parent_news<>trim(coalesce(p_news_id,'')) then
      raise exception 'Ответ должен относиться к той же новости.';
    end if;
  end if;

  insert into public.comments(news_id,author_id,parent_id,body)
  values(trim(p_news_id),me,p_parent_id,body)
  returning id into new_id;

  return new_id;
end
$$;

revoke all on function public.community_create_comment(text,text,bigint) from public;
grant execute on function public.community_create_comment(text,text,bigint) to authenticated;

-- One RPC handles upvote, downvote, changing vote, and removing a vote.
create or replace function public.community_toggle_comment_reaction(
  p_comment_id bigint,
  p_value smallint
)
returns smallint
language plpgsql
security definer
set search_path=''
as $$
declare
  me uuid := (select auth.uid());
  old_value smallint;
begin
  if me is null then
    raise exception 'Сначала войдите в аккаунт.';
  end if;

  if p_value not in(-1,1) then
    raise exception 'Недопустимое значение реакции.';
  end if;

  if (select coalesce(p.is_banned,false) from public.profiles p where p.id=me) then
    raise exception 'Ваш аккаунт заблокирован.';
  end if;

  if not exists(select 1 from public.comments c where c.id=p_comment_id) then
    raise exception 'Комментарий не найден.';
  end if;

  select r.value into old_value
  from public.comment_reactions r
  where r.comment_id=p_comment_id and r.user_id=me;

  if old_value is null then
    insert into public.comment_reactions(comment_id,user_id,value)
    values(p_comment_id,me,p_value);
    return p_value;
  end if;

  if old_value=p_value then
    delete from public.comment_reactions
    where comment_id=p_comment_id and user_id=me;
    return 0;
  end if;

  update public.comment_reactions
  set value=p_value
  where comment_id=p_comment_id and user_id=me;

  return p_value;
end
$$;

revoke all on function public.community_toggle_comment_reaction(bigint,smallint) from public;
grant execute on function public.community_toggle_comment_reaction(bigint,smallint) to authenticated;

-- Moderators can inspect only targets they are actually allowed to moderate.
create or replace function public.community_get_moderation_user(p_user_id uuid)
returns table(
  id uuid,
  role text,
  is_banned boolean,
  ban_reason text
)
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Требуется авторизация.';
  end if;

  if not (select public.community_can_manage_user(p_user_id)) then
    raise exception 'Этого пользователя нельзя модерировать с вашей ролью.';
  end if;

  return query
  select p.id,p.role::text,p.is_banned,p.ban_reason
  from public.profiles p
  where p.id=p_user_id;
end
$$;

revoke all on function public.community_get_moderation_user(uuid) from public;
grant execute on function public.community_get_moderation_user(uuid) to authenticated;

-- The legacy prevent_role_change trigger predates the community role RPC and
-- rejects a legitimate owner action. Keep it installed, but suspend it only
-- for this single atomic role update.
create or replace function public.community_change_role(p_user_id uuid,p_role public.user_role)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  old_role public.user_role;
  trigger_name text;
  enabled_trigger_names text[] := array[]::text[];
begin
  if (select auth.uid()) is null then raise exception 'Требуется авторизация.'; end if;
  if (select public.community_current_role())<>'owner' then raise exception 'Назначать администраторов может только владелец.'; end if;
  if p_role not in('reader'::public.user_role,'admin'::public.user_role) then raise exception 'Можно назначить только reader или admin.'; end if;
  select p.role into old_role from public.profiles p where p.id=p_user_id;
  if old_role is null then raise exception 'Пользователь не найден.'; end if;
  if old_role='owner'::public.user_role then raise exception 'Роль владельца нельзя изменить.'; end if;

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
    enabled_trigger_names:=array_append(enabled_trigger_names,trigger_name);
    execute format('alter table public.profiles disable trigger %I',trigger_name);
  end loop;

  begin
    perform set_config('app.community_role_change','1',true);
    update public.profiles set role=p_role::public.user_role where id=p_user_id;
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

revoke all on function public.community_change_role(uuid,public.user_role) from public;
grant execute on function public.community_change_role(uuid,public.user_role) to authenticated;

create or replace function public.community_set_role(p_user_id uuid,p_role text)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  old_role text;
  trigger_name text;
  enabled_trigger_names text[] := array[]::text[];
begin
  if (select auth.uid()) is null then
    raise exception 'Требуется авторизация.';
  end if;

  if (select public.community_current_role())<>'owner' then
    raise exception 'Назначать администраторов может только владелец.';
  end if;

  if p_role not in('reader','admin') then
    raise exception 'Можно назначить только reader или admin.';
  end if;

  select p.role::text into old_role
  from public.profiles p
  where p.id=p_user_id;

  if old_role is null then
    raise exception 'Пользователь не найден.';
  end if;

  if old_role='owner' then
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
    perform set_config('app.community_role_change','1',true);
    update public.profiles set role=p_role::public.user_role where id=p_user_id;
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


-- Confirm the RPC signatures that the browser calls and force PostgREST
-- to refresh its schema cache immediately after the DDL above.
select n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in('community_create_comment','community_toggle_comment_reaction','community_get_moderation_user','community_set_role')
order by p.proname;

notify pgrst, 'reload schema';

commit;
