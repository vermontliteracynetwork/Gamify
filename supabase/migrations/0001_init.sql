-- Gamify database, version 1. Paste into Supabase: SQL Editor -> New query -> Run.
-- Safe to run once on a new project. Every table has row level security, so a
-- teacher can only ever see and change their own data.

-- Teacher profile (one per signed-in teacher).
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  tier text not null default 'free' check (tier in ('free', 'plus', 'pro', 'school')),
  created_at timestamptz not null default now()
);

-- Question sets. Multiple choice only for now; questions live in a JSON list.
create table if not exists public.question_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null default '',
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  grade text,
  subject text,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  allowed_modes text[],               -- null = all four play modes
  join_code text unique,              -- class code students type at /join
  created_at timestamptz not null default now()
);

-- Students are class-list entries, not accounts (no email, no password).
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms on delete cascade,
  name text not null,
  picture_password text[] not null default '{}',
  allowed_modes text[],               -- narrows the class's modes for this student
  settings jsonb not null default '{}'::jsonb,  -- accommodations and preferences
  created_at timestamptz not null default now()
);

-- A set assigned to a whole class (student_id null) or to one student.
create table if not exists public.set_assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms on delete cascade,
  set_id uuid not null references public.question_sets on delete cascade,
  student_id uuid references public.students on delete cascade,
  starred boolean not null default false,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);

-- One row per question shown, in every game (feeds the teacher reports).
create table if not exists public.question_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  classroom_id uuid references public.classrooms on delete cascade,
  student_id uuid references public.students on delete cascade,
  team_name text,
  game_id text not null,
  mode text not null check (mode in ('live', 'share', 'solo', 'versus')),
  set_id uuid references public.question_sets on delete set null,
  prompt text not null,
  answer text not null,
  tries text[] not null default '{}',
  ms integer not null default 0,
  outcome text not null check (outcome in ('right', 'skipped', 'left', 'timeout'))
);

-- "Tell Gamify" reports. Anyone can send one; only the owner reads them
-- (through the Supabase dashboard until the owner dashboard exists).
create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  kind text not null check (kind in ('bug', 'problem', 'idea')),
  details text not null default '' check (char_length(details) <= 1000),
  where_at text,
  role text not null check (role in ('teacher', 'student')),
  device text,
  user_id uuid default auth.uid()
);

-- Per-teacher settings (default accommodations and so on).
create table if not exists public.teacher_settings (
  owner_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb
);

create index if not exists question_sets_owner_idx on public.question_sets (owner_id);
create index if not exists classrooms_owner_idx on public.classrooms (owner_id);
create index if not exists students_class_idx on public.students (classroom_id);
create index if not exists assignments_class_idx on public.set_assignments (classroom_id);
create index if not exists log_class_at_idx on public.question_log (classroom_id, at desc);
create index if not exists log_student_at_idx on public.question_log (student_id, at desc);

-- Keep updated_at current.
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists question_sets_touch on public.question_sets;
create trigger question_sets_touch before update on public.question_sets
  for each row execute function public.touch_updated_at();

-- A profile row appears when a teacher signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id) values (new.id) on conflict do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- True when the signed-in teacher owns this classroom.
create or replace function public.owns_classroom(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classrooms c where c.id = cid and c.owner_id = auth.uid())
$$;

-- Row level security: on for every table.
alter table public.profiles enable row level security;
alter table public.question_sets enable row level security;
alter table public.classrooms enable row level security;
alter table public.students enable row level security;
alter table public.set_assignments enable row level security;
alter table public.question_log enable row level security;
alter table public.feedback_reports enable row level security;
alter table public.teacher_settings enable row level security;

create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

create policy "read own or public sets" on public.question_sets for select using (owner_id = auth.uid() or visibility = 'public');
create policy "write own sets" on public.question_sets for insert with check (owner_id = auth.uid());
create policy "update own sets" on public.question_sets for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "delete own sets" on public.question_sets for delete using (owner_id = auth.uid());

create policy "own classrooms" on public.classrooms for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "students in own classrooms" on public.students for all using (public.owns_classroom(classroom_id)) with check (public.owns_classroom(classroom_id));
create policy "assignments in own classrooms" on public.set_assignments for all using (public.owns_classroom(classroom_id)) with check (public.owns_classroom(classroom_id));
create policy "log in own classrooms" on public.question_log for all using (public.owns_classroom(classroom_id)) with check (public.owns_classroom(classroom_id));
create policy "own teacher settings" on public.teacher_settings for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "anyone can send feedback" on public.feedback_reports for insert to anon, authenticated with check (true);
-- No select policy on feedback_reports: only the owner reads it, from the dashboard.

-- Students playing on their own devices (join codes, picture sign-in, logging
-- answers) will go through safe server functions added in a later migration.
