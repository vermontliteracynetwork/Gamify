-- Gamify 0010: the owner's developer dashboard (/owner) reads real numbers.
-- Marks the vtliteracynetwork account as the owner, and adds one function
-- only the owner can call: plan counts, sign-ups per week, and use per week.
-- No names, emails or student details leave the database. Safe to run again.
update public.profiles set is_owner = true where username = 'vtliteracynetwork';

create or replace function public.owner_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_owner() then raise exception 'owner only'; end if;
  select jsonb_build_object(
    'tiers', (select coalesce(jsonb_object_agg(tier, n), '{}'::jsonb) from (select tier, count(*) n from public.profiles group by tier) t),
    'teachers', (select count(*) from public.profiles),
    'classes', (select count(*) from public.classrooms),
    'students', (select count(*) from public.students),
    'sets', (select count(*) from public.question_sets),
    'answers', (select count(*) from public.question_log),
    'codes', (select count(*) from public.game_codes),
    'signups', (select coalesce(jsonb_agg(jsonb_build_object('week', w, 'n', n) order by w), '[]'::jsonb) from (
      select date_trunc('week', created_at)::date w, count(*) n from public.profiles
      where created_at > now() - interval '26 weeks' group by 1) s),
    'answersByWeek', (select coalesce(jsonb_agg(jsonb_build_object('week', w, 'n', n) order by w), '[]'::jsonb) from (
      select date_trunc('week', at)::date w, count(*) n from public.question_log
      where at > now() - interval '26 weeks' group by 1) a)
  ) into result;
  return result;
end $$;
revoke all on function public.owner_stats() from public, anon;
grant execute on function public.owner_stats() to authenticated;
