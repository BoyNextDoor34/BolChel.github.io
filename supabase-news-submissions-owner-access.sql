-- Allow the site owner to receive and moderate reader news suggestions.
-- Run once in Supabase SQL Editor against the existing news_submissions table.
-- This migration is safe to rerun.

alter table public.news_submissions enable row level security;

-- The original policy was written before the owner role existed and allowed
-- "admin" to see all submissions, while everyone else could only see their own.
drop policy if exists "Readers can view own submissions and admins can view all" on public.news_submissions;
create policy "Readers can view own submissions and staff can view all"
  on public.news_submissions
  for select
  to authenticated
  using (
    auth.uid() = author_id
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin','owner')
    )
  );

-- Both administrator and owner can review pending submissions and updates.
drop policy if exists "Admins can review submissions" on public.news_submissions;
create policy "Admins and owners can review submissions"
  on public.news_submissions
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin','owner')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin','owner')
    )
  );

-- Keep the existing reader self-edit workflow while allowing staff moderation.
drop policy if exists "Readers can update own submissions" on public.news_submissions;
create policy "Readers can update own submissions"
  on public.news_submissions
  for update
  to authenticated
  using (
    auth.uid() = author_id
    and status in ('pending','rejected','approved','pending_update')
  )
  with check (
    auth.uid() = author_id
    and status in ('pending','pending_update')
  );

-- Both administrator and owner can delete submissions from moderation.
drop policy if exists "Admins can delete submissions" on public.news_submissions;
create policy "Admins and owners can delete submissions"
  on public.news_submissions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin','owner')
    )
  );

-- Keep the reader-side restriction for deleting only their own pending/rejected
-- submissions. This policy can coexist with the staff policy above.
drop policy if exists "Readers can delete own pending or rejected submissions" on public.news_submissions;
create policy "Readers can delete own pending or rejected submissions"
  on public.news_submissions
  for delete
  to authenticated
  using (
    auth.uid() = author_id
    and status in ('pending','rejected')
  );

notify pgrst, 'reload schema';
