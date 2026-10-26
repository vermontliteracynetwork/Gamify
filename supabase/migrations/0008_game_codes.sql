-- Gamify 0008: students join from their own devices (development plan
-- Stage 5). A teacher's game code, its question set and its student list
-- reach a student by the code alone, one code at a time, through safe
-- functions (never a list). Students sign in with their picture and PIN, and
-- their answers land in the teacher's reports. Run after 0007. Safe to run
-- more than once.

create table if not exists public.game_codes (
  code text primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  game_id text not null,
  set_id text not null,
  kind text not null default 'play' check (kind in ('play', 'live', 'versus', 'mirror')),
  set_snapshot jsonb not null default '{}'::jsonb,
  roster_class uuid references public.classrooms on delete set null,
  created_at timestamptz not null default now(),
  constraint game_codes_size check (octet_length(set_snapshot::text) <= 2000000)
);
create index if not exists game_codes_owner_idx on public.game_codes (owner_id);
alter table public.game_codes enable row level security;
drop policy if exists "own game codes" on public.game_codes;
create policy "own game codes" on public.game_codes for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- One game code (codes stop working after 14 days).
create or replace function public.game_by_code(c text)
returns table (code text, game_id text, set_id text, kind text, set_snapshot jsonb, roster_class uuid, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.code, g.game_id, g.set_id, g.kind, g.set_snapshot, g.roster_class, g.created_at
  from public.game_codes g where g.code = upper(c) and g.created_at > now() - interval '14 days'
$$;
grant execute on function public.game_by_code(text) to anon, authenticated;

-- A class join code leads to that class's sign-in.
create or replace function public.class_by_code(c text)
returns table (id uuid, name text)
language sql stable security definer set search_path = public as $$
  select cl.id, cl.name from public.classrooms cl where cl.join_code = upper(c)
$$;
grant execute on function public.class_by_code(text) to anon, authenticated;

-- The sign-in list: first names (or nicknames) and pictures, never PINs.
create or replace function public.roster(cid uuid)
returns table (id uuid, name text, avatar text)
language sql stable security definer set search_path = public as $$
  select s.id, s.name, coalesce(s.settings->>'avatar', s.picture_password[1])
  from public.students s where s.classroom_id = cid order by s.created_at
$$;
grant execute on function public.roster(uuid) to anon, authenticated;

-- True when the PIN matches; the PIN itself never leaves the database.
create or replace function public.check_pin(sid uuid, pin text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students s where s.id = sid and s.settings->>'pin' = pin)
$$;
grant execute on function public.check_pin(uuid, text) to anon, authenticated;

-- A student's answer in a game reached by code goes to that teacher's reports.
create or replace function public.log_by_code(c text, e jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare g public.game_codes;
begin
  select * into g from public.game_codes where code = upper(c) and created_at > now() - interval '14 days';
  if g.code is null then return; end if;
  insert into public.question_log (id, at, owner_id, classroom_id, student_id, team_name, game_id, mode, set_id, prompt, answer, tries, ms, outcome)
  values (
    coalesce((e->>'id')::uuid, gen_random_uuid()), now(), g.owner_id, g.roster_class,
    left(e->>'student_id', 80), left(e->>'team_name', 40), g.game_id,
    coalesce(nullif(e->>'mode', ''), 'solo'), g.set_id,
    left(coalesce(e->>'prompt', ''), 2000), left(coalesce(e->>'answer', ''), 500),
    coalesce(array(select left(x, 500) from jsonb_array_elements_text(coalesce(e->'tries', '[]'::jsonb)) x limit 10), '{}'),
    least(greatest(coalesce((e->>'ms')::int, 0), 0), 3600000),
    coalesce(nullif(e->>'outcome', ''), 'right')
  ) on conflict (id) do nothing;
end $$;
grant execute on function public.log_by_code(text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
