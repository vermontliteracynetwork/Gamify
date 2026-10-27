-- Gamify 0011: access codes and beta tester plans (development plan Stage 7).
-- An access code (like the Vermont Literacy Network code) gives a Free
-- teacher a plan for some months; the owner can also give any account a plan,
-- for a time or for good. When the time is up the account is back on Free.
-- No payment details are stored. Run after 0010. Safe to run more than once.

alter table public.profiles add column if not exists plan_until timestamptz;
alter table public.profiles add column if not exists plan_note text;

create table if not exists public.access_codes (
  code text primary key check (code ~ '^[A-Z0-9]{4,20}$'),
  tier text not null check (tier in ('plus', 'pro', 'homeschool')),
  months int not null check (months between 1 and 24),
  max_uses int not null default 100 check (max_uses between 1 and 100000),
  uses int not null default 0,
  beta boolean not null default true,
  note text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.access_codes enable row level security;
drop policy if exists "owner manages codes" on public.access_codes;
create policy "owner manages codes" on public.access_codes for all using (public.is_owner()) with check (public.is_owner());

create table if not exists public.code_redemptions (
  code text not null references public.access_codes on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  at timestamptz not null default now(),
  primary key (code, user_id)
);
alter table public.code_redemptions enable row level security;
drop policy if exists "owner reads redemptions" on public.code_redemptions;
create policy "owner reads redemptions" on public.code_redemptions for select using (public.is_owner());

-- A teacher redeems a code. Only a Free (or expired) account can; a beta code
-- needs the beta tester agreement.
create or replace function public.redeem_code(c text, agree boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k public.access_codes; p public.profiles; until timestamptz;
begin
  if auth.uid() is null then return jsonb_build_object('problem', 'signin'); end if;
  select * into k from public.access_codes where code = upper(trim(c));
  if not found or (k.expires_at is not null and k.expires_at < now()) then return jsonb_build_object('problem', 'unknown'); end if;
  if k.uses >= k.max_uses then return jsonb_build_object('problem', 'used'); end if;
  if exists (select 1 from public.code_redemptions where code = k.code and user_id = auth.uid()) then return jsonb_build_object('problem', 'again'); end if;
  select * into p from public.profiles where id = auth.uid();
  if p.tier <> 'free' and (p.plan_until is null or p.plan_until > now()) then return jsonb_build_object('problem', 'paid'); end if;
  if k.beta and not agree then return jsonb_build_object('problem', 'agreement'); end if;
  until := now() + make_interval(months => k.months);
  update public.profiles set tier = k.tier, plan_until = until, plan_note = 'code ' || k.code where id = auth.uid();
  update public.access_codes set uses = uses + 1 where code = k.code;
  insert into public.code_redemptions (code, user_id) values (k.code, auth.uid());
  return jsonb_build_object('tier', k.tier, 'until', until);
end $$;
revoke all on function public.redeem_code(text, boolean) from public, anon;
grant execute on function public.redeem_code(text, boolean) to authenticated;

-- The owner gives an account a plan: months > 0 for a time, 0 for good.
create or replace function public.owner_grant(u text, t text, months int, note text default 'beta')
returns jsonb language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_owner() then raise exception 'owner only'; end if;
  if t not in ('free', 'plus', 'pro', 'homeschool') then raise exception 'bad plan'; end if;
  update public.profiles set tier = t,
    plan_until = case when months > 0 and t <> 'free' then now() + make_interval(months => months) else null end,
    plan_note = case when t = 'free' then null else note end
  where username = lower(trim(u));
  get diagnostics n = row_count;
  return jsonb_build_object('found', n > 0);
end $$;
revoke all on function public.owner_grant(text, text, int, text) from public, anon;
grant execute on function public.owner_grant(text, text, int, text) to authenticated;

-- The owner's list of given plans (usernames only).
create or replace function public.owner_grants()
returns table (username text, tier text, plan_until timestamptz, plan_note text)
language sql stable security definer set search_path = public as $$
  select p.username, p.tier, p.plan_until, p.plan_note from public.profiles p
  where public.is_owner() and p.plan_note is not null order by p.plan_until nulls last
$$;
revoke all on function public.owner_grants() from public, anon;
grant execute on function public.owner_grants() to authenticated;

-- Teachers read their own plan_until and plan_note with their profile.
grant select on public.profiles to authenticated;
notify pgrst, 'reload schema';
