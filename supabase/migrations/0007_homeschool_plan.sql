-- Gamify 0007: the Homeschool plan (teacher, 2026-10-26) is a plan a
-- profile can hold. Run after 0006. Safe to run more than once.
alter table public.profiles drop constraint if exists profiles_tier_check;
alter table public.profiles add constraint profiles_tier_check check (tier in ('free', 'plus', 'pro', 'school', 'homeschool'));
notify pgrst, 'reload schema';
