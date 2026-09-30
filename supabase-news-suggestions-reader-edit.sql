-- Allow readers to edit and delete their own unpublished/previously rejected submissions.
-- Run once in Supabase SQL Editor after the existing news_submissions migration.

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

drop policy if exists "Readers can delete own pending or rejected submissions" on public.news_submissions;
create policy "Readers can delete own pending or rejected submissions"
  on public.news_submissions
  for delete
  to authenticated
  using (
    auth.uid() = author_id
    and status in ('pending','rejected')
  );
