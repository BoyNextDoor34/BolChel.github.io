/*
  COMMUNITY SYSTEM — ONE-TIME ENUM PREFLIGHT

  Run this file ALONE in Supabase SQL Editor and wait for it to finish
  successfully BEFORE running community-system.sql.

  The existing profiles.role column uses PostgreSQL enum user_role.
  PostgreSQL does not allow a newly-added enum value to be used safely
  inside the same transaction in which it was added. The previous
  preflight incorrectly tried to change the type of profiles.role; that
  cannot work because existing RLS policies depend on that column.

  This file therefore does ONE thing only: add the owner enum value.
  It must be committed separately. It does not alter profiles.role,
  policies, users, or any existing data.
*/

alter type public.user_role add value if not exists 'owner';
