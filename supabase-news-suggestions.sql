-- News suggestion workflow for authenticated readers.
-- Run this script once in Supabase SQL Editor.

create table if not exists public.news_submissions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  summary text not null default '',
  body text not null,
  image_url text not null,
  palette jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

create index if not exists news_submissions_status_created_at_idx
  on public.news_submissions(status, created_at desc);

alter table public.news_submissions enable row level security;

drop policy if exists "Readers can submit news" on public.news_submissions;
create policy "Readers can submit news"
  on public.news_submissions
  for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Readers can view own submissions and admins can view all" on public.news_submissions;
create policy "Readers can view own submissions and admins can view all"
  on public.news_submissions
  for select
  to authenticated
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can review submissions" on public.news_submissions;
create policy "Admins can review submissions"
  on public.news_submissions
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can delete submissions" on public.news_submissions;
create policy "Admins can delete submissions"
  on public.news_submissions
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Allow authenticated readers to upload suggestion images into
-- suggestions/<their-user-id>/... inside the existing public news-images bucket.
drop policy if exists "Readers can upload suggestion images" on storage.objects;
create policy "Readers can upload suggestion images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'news-images'
    and name like ('suggestions/' || auth.uid()::text || '/%')
  );
