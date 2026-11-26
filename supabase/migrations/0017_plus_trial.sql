-- Gamify 0017: the 7-day Plus reverse trial (owner, 2026-11-26: "plus should
-- have 7 day reverse trial"). Safe to run more than once.
-- Every account made after this runs gets trial_started_at = the moment it
-- was made; the app plays it on Plus for 7 days (TRIAL in src/config.ts),
-- then on its real plan (Free unless paid). Accounts made before this run
-- keep null: no trial. Teachers cannot change it (0003 lets them update
-- display_name only). To give someone a fresh trial, set it to now() in the
-- Table Editor; to end one, set it to null.

alter table public.profiles add column if not exists trial_started_at timestamptz;
-- The default applies only to new rows, so existing accounts stay null.
alter table public.profiles alter column trial_started_at set default now();
