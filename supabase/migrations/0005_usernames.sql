-- Gamify 0005: teachers have usernames (teacher, 2026-10-26). Teachers sign
-- up with email, password and a username, and log in with username and
-- password. Run after 0001 to 0004. Safe to run more than once.

alter table public.profiles add column if not exists username text;
alter table public.profiles drop constraint if exists profiles_username_rule;
alter table public.profiles add constraint profiles_username_rule check (username is null or username ~ '^[a-z0-9._]{3,20}$');
create unique index if not exists profiles_username_key on public.profiles (username);

-- A new account copies the username it signed up with onto its profile.
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name', ''), lower(new.raw_user_meta_data->>'username'))
  on conflict (id) do nothing;
  return new;
end $$;

-- Logging in with a username: the app's server endpoint (with the service
-- key, never the browser) looks up the email for a username, then signs in.
-- Emails are never readable by other teachers. The sign-up form asks this
-- whether a username is free, without revealing anything else.
create or replace function public.username_free(u text) returns boolean
  language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where username = lower(u)) $$;
grant execute on function public.username_free(text) to anon, authenticated;
