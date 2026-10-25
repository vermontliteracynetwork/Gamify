-- Gamify 0003: security fixes from the launch security review
-- (docs/security-review.md). Run after 0001 and 0002. Safe to run more than once.

-- 1. A teacher could change their own plan or make themselves the owner:
--    the 0001 profile policy allowed every column of their own row. Now a
--    teacher can read their profile and change only their display name. The
--    plan (tier) is set by the billing webhook with the service key, and
--    is_owner only by you in the Supabase dashboard.
drop policy if exists "own profile" on public.profiles;
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "rename own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (id = auth.uid());
create policy "rename own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- 2. Size limits, so one account can't fill the database with huge rows.
--    Theme pictures are stored as small images inside the theme; 6 MB covers
--    a full design. A question set's questions stay under 2 MB.
alter table public.themes drop constraint if exists themes_size;
alter table public.themes add constraint themes_size check (octet_length(data::text) <= 6000000);
alter table public.question_sets drop constraint if exists question_sets_size;
alter table public.question_sets add constraint question_sets_size check (octet_length(questions::text) <= 2000000);
alter table public.feedback_reports drop constraint if exists feedback_where_size;
alter table public.feedback_reports add constraint feedback_where_size check (char_length(coalesce(where_at, '')) <= 300 and char_length(coalesce(device, '')) <= 300);

-- 3. A class can only use its own teacher's sign-in pictures theme (or a
--    library one), not another teacher's private theme.
create or replace function public.can_use_theme(tid uuid) returns boolean
  language sql stable security definer set search_path = public
  as $$ select tid is null or exists (select 1 from public.themes t where t.id = tid and (t.owner_id = auth.uid() or t.source = 'library')) $$;
alter table public.classrooms drop constraint if exists classrooms_own_theme;
drop policy if exists "own classrooms" on public.classrooms;
create policy "own classrooms" on public.classrooms for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.can_use_theme(sign_in_theme_id));
