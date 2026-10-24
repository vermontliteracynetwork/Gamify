-- Gamify 0002: question set details, class sign-in pictures, Theme Builder themes.
-- Safe to run more than once.

-- Question set details (all required in the app before a set can be played).
alter table public.question_sets add column if not exists grade_from text;
alter table public.question_sets add column if not exists grade_to text;
alter table public.question_sets add column if not exists tags text[] not null default '{}';
alter table public.question_sets add column if not exists standards text[] not null default '{}';
alter table public.question_sets add column if not exists no_standard boolean not null default false;
alter table public.question_sets add column if not exists cover text;
create index if not exists question_sets_subject_idx on public.question_sets (subject);
create index if not exists question_sets_tags_idx on public.question_sets using gin (tags);
create index if not exists question_sets_standards_idx on public.question_sets using gin (standards);

-- The owner (you) can publish library themes.
alter table public.profiles add column if not exists is_owner boolean not null default false;
create or replace function public.is_owner() returns boolean
  language sql stable security definer set search_path = public
  as $$ select coalesce((select is_owner from public.profiles where id = auth.uid()), false) $$;

-- Themes made in the Theme Builder: a teacher's own (custom) or library themes.
create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  game_id text not null,              -- a game id, or 'sign-in' for sign-in pictures
  name text not null,
  source text not null default 'custom' check (source in ('custom', 'library')),
  data jsonb not null default '{}'::jsonb,  -- colors, pieces (pictures), cover
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists themes_owner_idx on public.themes (owner_id);
create index if not exists themes_game_idx on public.themes (game_id);
alter table public.themes enable row level security;

drop policy if exists "read own or library themes" on public.themes;
create policy "read own or library themes" on public.themes for select
  using (owner_id = auth.uid() or source = 'library');
drop policy if exists "write own themes" on public.themes;
create policy "write own themes" on public.themes for insert
  with check (owner_id = auth.uid() and (source = 'custom' or public.is_owner()));
drop policy if exists "update own themes" on public.themes;
create policy "update own themes" on public.themes for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and (source = 'custom' or public.is_owner()));
drop policy if exists "delete own themes" on public.themes;
create policy "delete own themes" on public.themes for delete using (owner_id = auth.uid());

-- Which drawn sign-in pictures a class uses (null = built-in pictures).
alter table public.classrooms add column if not exists sign_in_theme_id uuid references public.themes on delete set null;
