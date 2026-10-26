-- Gamify 0009: homework links with a due date (teacher, 2026-10-26).
-- A game code with a due date works through that day; other codes still
-- stop after 14 days. Safe to run more than once.
alter table public.game_codes add column if not exists due date;

create or replace function public.game_by_code(c text)
returns table (code text, game_id text, set_id text, kind text, set_snapshot jsonb, roster_class uuid, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.code, g.game_id, g.set_id, g.kind, g.set_snapshot, g.roster_class, g.created_at
  from public.game_codes g
  where g.code = upper(c)
    and case when g.due is not null then current_date <= g.due
             else g.created_at > now() - interval '14 days' end
$$;
grant execute on function public.game_by_code(text) to anon, authenticated;
