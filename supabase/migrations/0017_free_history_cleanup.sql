-- Free saves nothing after today (owner, 2026-11-26: "delete free data
-- nightly"). Every night at 3:00 am Eastern (08:00 UTC; 4:00 am in summer)
-- this deletes the answer log of every teacher on the Free plan from before
-- today, Eastern time. Paid plans (and Free teachers whose paid plan_until is
-- still running) keep everything.
-- Needs the pg_cron extension: Supabase dashboard, Database, Extensions,
-- turn on pg_cron, then run this file in the SQL editor.

create extension if not exists pg_cron;

create or replace function public.delete_free_history()
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.question_log q
  using public.profiles p
  where q.owner_id = p.id
    and p.tier = 'free'
    and q.at < (date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York');
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.delete_free_history() from public, anon, authenticated;

select cron.unschedule('gamify-delete-free-history') where exists (select 1 from cron.job where jobname = 'gamify-delete-free-history');
select cron.schedule('gamify-delete-free-history', '0 8 * * *', $$select public.delete_free_history()$$);
