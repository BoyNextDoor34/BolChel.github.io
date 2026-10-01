-- Applied to the production Supabase project.
-- Repairs owner role changes, protects the role trigger, and persists edit markers.

begin;

create table if not exists public.comment_edits (
  comment_id bigint primary key references public.comments(id) on delete cascade,
  editor_id uuid not null references public.profiles(id) on delete cascade,
  edited_at timestamptz not null default now()
);

alter table public.comment_edits enable row level security;

drop policy if exists "community comment edits are public" on public.comment_edits;
create policy "community comment edits are public"
on public.comment_edits for select to anon, authenticated using (true);

drop policy if exists "community users mark own comment edits" on public.comment_edits;
create policy "community users mark own comment edits"
on public.comment_edits for insert to authenticated
with check (
  editor_id=auth.uid()
  and exists (select 1 from public.comments c where c.id=comment_id and c.author_id=auth.uid())
);

drop policy if exists "community users update own comment edit marker" on public.comment_edits;
create policy "community users update own comment edit marker"
on public.comment_edits for update to authenticated
using (editor_id=auth.uid()) with check (editor_id=auth.uid());

grant select on public.comment_edits to anon, authenticated;
grant insert, update on public.comment_edits to authenticated;

create or replace function public.community_mark_comment_edited()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.body is distinct from old.body then
    insert into public.comment_edits(comment_id,editor_id,edited_at)
    values(new.id,coalesce(auth.uid(),new.author_id),now())
    on conflict(comment_id) do update
      set editor_id=excluded.editor_id, edited_at=excluded.edited_at;
  end if;
  return new;
end
$$;

drop trigger if exists community_comment_edit_marker on public.comments;
create trigger community_comment_edit_marker
after update of body on public.comments
for each row execute function public.community_mark_comment_edited();

create or replace function public.prevent_role_change()
returns trigger language plpgsql as $function$
begin
  if new.role is distinct from old.role then
    if coalesce(current_setting('app.community_role_change', true), '')='1'
       and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='owner'::public.user_role) then
      return new;
    end if;
    if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'::public.user_role) then
      raise exception 'Only an admin may change roles';
    end if;
  end if;
  return new;
end
$function$;

create or replace function public.community_set_role(p_user_id uuid,p_role text)
returns boolean language plpgsql security definer set search_path='' as $$
declare old_role text; new_role public.user_role;
begin
  if auth.uid() is null then raise exception 'Требуется авторизация.'; end if;
  if (select public.community_current_role()) <> 'owner' then raise exception 'Назначать администраторов может только владелец.'; end if;
  if p_role not in ('reader','admin') then raise exception 'Можно назначить только reader или admin.'; end if;
  new_role:=p_role::public.user_role;
  select p.role::text into old_role from public.profiles p where p.id=p_user_id;
  if old_role is null then raise exception 'Пользователь не найден.'; end if;
  if old_role='owner' then raise exception 'Роль владельца нельзя изменить.'; end if;
  perform set_config('app.community_role_change','1',true);
  update public.profiles set role=new_role where id=p_user_id;
  return true;
end
$$;

revoke all on function public.community_set_role(uuid,text) from public;
grant execute on function public.community_set_role(uuid,text) to authenticated;
notify pgrst,'reload schema';
commit;
