-- Gamify 0006: cloud accounts (Stage 5). Columns for everything the app
-- saves, reports for built-in library sets and guest players, a teacher's
-- own games (no class) in their reports, and the owner's Tell Gamify inbox.
-- Run after 0001 to 0005. Safe to run more than once.

alter table public.classrooms add column if not exists student_design boolean not null default false;
alter table public.classrooms add column if not exists sign_in_theme text;
alter table public.set_assignments add column if not exists theme_ids text[];

-- Built-in library sets can be assigned and played, so set ids are text.
alter table public.set_assignments drop constraint if exists set_assignments_set_id_fkey;
alter table public.set_assignments alter column set_id type text using set_id::text;
alter table public.question_log drop constraint if exists question_log_set_id_fkey;
alter table public.question_log alter column set_id type text using set_id::text;

-- Guests who join by code (not on the class list) are logged too.
alter table public.question_log drop constraint if exists question_log_student_id_fkey;
alter table public.question_log alter column student_id type text using student_id::text;

-- Every answer row belongs to a teacher, so games played without a class
-- still reach that teacher's reports.
alter table public.question_log add column if not exists owner_id uuid default auth.uid() references auth.users on delete cascade;
create index if not exists log_owner_at_idx on public.question_log (owner_id, at desc);
drop policy if exists "log in own classrooms" on public.question_log;
drop policy if exists "own log" on public.question_log;
create policy "own log" on public.question_log for all
  using (owner_id = auth.uid() or public.owns_classroom(classroom_id))
  with check (owner_id = auth.uid() and (classroom_id is null or public.owns_classroom(classroom_id)));

-- The owner reads every Tell Gamify report.
drop policy if exists "owner reads feedback" on public.feedback_reports;
create policy "owner reads feedback" on public.feedback_reports for select to authenticated using (public.is_owner());

notify pgrst, 'reload schema';
