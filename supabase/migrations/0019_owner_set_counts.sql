-- Gamify 0019: question sets made by teachers (not the owner), counted for
-- the developer portal's home card (owner, 2026-11-27: "question sets created
-- by users (not me) (filter to sort by day, week, month, year to date, all
-- time)"). Counts only; no names or set contents leave the database. Safe to
-- run again.
create or replace function public.owner_set_counts()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_owner() then raise exception 'owner only'; end if;
  with s as (
    select q.created_at from public.question_sets q
    left join public.profiles p on p.id = q.owner_id
    where coalesce(p.is_owner, false) = false
  )
  select jsonb_build_object(
    'day', (select count(*) from s where created_at >= date_trunc('day', now())),
    'week', (select count(*) from s where created_at >= now() - interval '7 days'),
    'month', (select count(*) from s where created_at >= now() - interval '30 days'),
    'ytd', (select count(*) from s where created_at >= date_trunc('year', now())),
    'all', (select count(*) from s)
  ) into result;
  return result;
end $$;
revoke all on function public.owner_set_counts() from public, anon;
grant execute on function public.owner_set_counts() to authenticated;
