-- Gamify 0014: co-op codes (teacher, 2026-11-20: "build b with 25% off").
-- A homeschool co-op gets its own code. Each family keeps its own account
-- and its children's data, and uses the code for 25% off the Homeschool plan
-- (and Plus). The co-op sees nothing about its families; the owner sees how
-- many joined. No payment details are stored here: at checkout the discount
-- is applied by the matching Stripe coupon. Run after 0013. Safe to run more
-- than once.

create table if not exists public.coop_codes (
  code text primary key check (code ~ '^[A-Z0-9]{4,20}$'),
  coop_name text not null check (char_length(coop_name) between 2 and 80),
  percent_off int not null default 25 check (percent_off between 1 and 50),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.coop_codes enable row level security;
drop policy if exists "owner manages coop codes" on public.coop_codes;
create policy "owner manages coop codes" on public.coop_codes for all using (public.is_owner()) with check (public.is_owner());

alter table public.profiles add column if not exists coop_code text references public.coop_codes on delete set null;

-- A family joins its co-op with the code: one co-op per account.
create or replace function public.join_coop(c text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k public.coop_codes;
begin
  if auth.uid() is null then return jsonb_build_object('problem', 'signin'); end if;
  select * into k from public.coop_codes where code = upper(trim(c)) and active;
  if not found then return jsonb_build_object('problem', 'unknown'); end if;
  update public.profiles set coop_code = k.code where id = auth.uid();
  return jsonb_build_object('coop', k.coop_name, 'percent', k.percent_off);
end $$;
revoke all on function public.join_coop(text) from public, anon;
grant execute on function public.join_coop(text) to authenticated;

-- The signed-in family's co-op, if any (name and discount only).
create or replace function public.my_coop()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce((select jsonb_build_object('coop', k.coop_name, 'percent', k.percent_off, 'code', k.code)
    from public.profiles p join public.coop_codes k on k.code = p.coop_code where p.id = auth.uid() and k.active), '{}'::jsonb);
$$;
revoke all on function public.my_coop() from public, anon;
grant execute on function public.my_coop() to authenticated;

-- The owner sees each code with how many families joined (no names).
create or replace function public.owner_coops()
returns table (code text, coop_name text, percent_off int, active boolean, families bigint)
language sql security definer set search_path = public stable as $$
  select k.code, k.coop_name, k.percent_off, k.active, (select count(*) from public.profiles p where p.coop_code = k.code)
  from public.coop_codes k where public.is_owner() order by k.created_at desc;
$$;
revoke all on function public.owner_coops() from public, anon;
grant execute on function public.owner_coops() to authenticated;
