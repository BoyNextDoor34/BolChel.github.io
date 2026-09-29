-- Enhanced workflow for reader suggestions and moderated edits.
-- Run after supabase-news-suggestions.sql.

alter table public.news_submissions
  add column if not exists news_id uuid references public.news(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists pending_category text,
  add column if not exists pending_title text,
  add column if not exists pending_summary text,
  add column if not exists pending_body text,
  add column if not exists pending_image_url text,
  add column if not exists pending_palette jsonb;

alter table public.news_submissions
  drop constraint if exists news_submissions_status_check;

alter table public.news_submissions
  add constraint news_submissions_status_check
  check (status in ('pending','approved','rejected','pending_update'));

-- Keep older approved suggestions connected to their published news where
-- title + author are still an exact match. New approvals always save news_id.
update public.news_submissions s
set news_id = n.id
from public.news n
where s.status = 'approved'
  and s.news_id is null
  and n.author_id = s.author_id
  and n.title = s.title;

-- Readers may update only their own suggestions. This is required for both
-- ordinary pending edits and creation of moderated revisions after publication.
drop policy if exists "Readers can update own submissions" on public.news_submissions;
create policy "Readers can update own submissions"
  on public.news_submissions
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- The existing admin update policy remains valid; this additional policy does
-- not grant readers access to another user's submission.

create index if not exists news_submissions_news_id_idx
  on public.news_submissions(news_id);

create index if not exists news_submissions_author_status_idx
  on public.news_submissions(author_id, status, created_at desc);
