-- Gamify 0016: an account the owner makes with a starting password must make
-- its own password on first sign-in (owner, 2026-11-26). Safe to run more
-- than once. The owner sets must_change_password on the profile; the app
-- shows "Make your own password" until the teacher saves a new one, then
-- password_changed() clears it. Teachers cannot set the flag themselves.

alter table public.profiles add column if not exists must_change_password boolean not null default false;

create or replace function public.password_changed() returns void
language sql security definer set search_path = public as $$
  update public.profiles set must_change_password = false where id = auth.uid();
$$;
revoke all on function public.password_changed() from public, anon;
grant execute on function public.password_changed() to authenticated;
