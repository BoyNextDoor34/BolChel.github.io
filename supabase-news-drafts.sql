-- Supabase migration for server-side saved drafts.
-- Run this once in the Supabase SQL editor.
--
-- Drafts are deliberately stored in Supabase instead of browser localStorage /
-- IndexedDB so they survive browser restarts, cache clearing and device changes.

create table if not exists public.news_drafts (
  id text primary key not null default gen_random_uuid()::text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'news' check (kind in ('news','suggestion')),
  title text not null default '',
  category text not null default 'Политика',
  summary text not null default '',
  body text not null default '',
  image_url text not null default '',
  author_id uuid null references auth.users(id) on delete set null,
  palette jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_drafts enable row level security;

drop policy if exists "news_drafts_select_own" on public.news_drafts;
create policy "news_drafts_select_own"
on public.news_drafts
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "news_drafts_insert_own" on public.news_drafts;
create policy "news_drafts_insert_own"
on public.news_drafts
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "news_drafts_update_own" on public.news_drafts;
create policy "news_drafts_update_own"
on public.news_drafts
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "news_drafts_delete_own" on public.news_drafts;
create policy "news_drafts_delete_own"
on public.news_drafts
for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists news_drafts_owner_updated_idx
  on public.news_drafts(owner_id, updated_at desc);

create or replace function public.touch_news_draft_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists news_drafts_touch_updated_at on public.news_drafts;
create trigger news_drafts_touch_updated_at
before update on public.news_drafts
for each row
execute function public.touch_news_draft_updated_at();
