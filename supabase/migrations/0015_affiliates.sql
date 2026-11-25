-- Gamify 0015: affiliates (owner, 2026-11-25). Safe to run more than once.
-- 1. A teacher who signs up from an affiliate's link or code keeps that code
--    on their profile (set once, at sign-up, by the server; teachers cannot
--    change it). 2. Affiliate applications arrive in Tell Gamify as
--    'affiliate'. 3. One owner-only function counts sign-ups and paid plans
--    per code. No names or emails leave the database.

alter table public.profiles add column if not exists referred_by text;
alter table public.profiles drop constraint if exists profiles_referred_by_check;
alter table public.profiles add constraint profiles_referred_by_check check (referred_by is null or referred_by ~ '^[A-Z0-9]{3,20}$');

create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
declare ref text := upper(regexp_replace(coalesce(new.raw_user_meta_data->>'ref', ''), '[^A-Za-z0-9]', '', 'g'));
begin
  insert into public.profiles (id, display_name, username, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name', ''),
    lower(new.raw_user_meta_data->>'username'),
    case when ref ~ '^[A-Z0-9]{3,20}$' then ref else null end
  )
  on conflict (id) do nothing;
  return new;
end $$;

alter table public.feedback_reports drop constraint if exists feedback_reports_kind_check;
alter table public.feedback_reports add constraint feedback_reports_kind_check check (kind in ('bug', 'problem', 'idea', 'help', 'beta', 'quote', 'affiliate'));

create or replace function public.owner_referrals()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_owner() then raise exception 'owner only'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'code', referred_by, 'signups', n, 'paid', paid, 'tiers', tiers, 'first', first_at, 'last', last_at) order by n desc), '[]'::jsonb)
  into result
  from (
    select referred_by, count(*) n, count(*) filter (where tier <> 'free') paid,
      (select jsonb_object_agg(tier, c) from (select tier, count(*) c from public.profiles p2 where p2.referred_by = p.referred_by group by tier) t) tiers,
      min(created_at)::date first_at, max(created_at)::date last_at
    from public.profiles p where referred_by is not null group by referred_by
  ) r;
  return result;
end $$;
revoke all on function public.owner_referrals() from public, anon;
grant execute on function public.owner_referrals() to authenticated;
