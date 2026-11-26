-- Gamify: which migrations has this database already run?
-- Paste into the Supabase SQL Editor and press Run. It only reads; it changes
-- nothing. Run any migration that shows "no", in number order.
select m.migration, case when m.done then 'yes' else 'no' end as already_run
from (values
  ('0001_init',                     to_regclass('public.question_sets') is not null),
  ('0002_details_themes',           exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'question_sets' and column_name = 'grade_from')),
  ('0003_lock_profiles',            exists (select 1 from pg_proc where proname = 'can_use_theme')),
  ('0004_school_quotes',            exists (select 1 from pg_constraint where conname = 'feedback_reports_kind_check' and pg_get_constraintdef(oid) like '%quote%')),
  ('0005_usernames',                exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'username')),
  ('0006_cloud_accounts',           exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'classrooms' and column_name = 'student_design')),
  ('0007_homeschool_plan',          exists (select 1 from pg_constraint where conname = 'profiles_tier_check' and pg_get_constraintdef(oid) like '%homeschool%')),
  ('0008_game_codes',               to_regclass('public.game_codes') is not null),
  ('0009_homework_due',             exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'game_codes' and column_name = 'due')),
  ('0010_owner_dashboard',          exists (select 1 from pg_proc where proname = 'owner_stats')),
  ('0011_access_codes',             to_regclass('public.access_codes') is not null),
  ('0012_owner_two_step_and_replies', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'feedback_reports' and column_name = 'reply')),
  ('0013_teach_cards',              exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'question_sets' and column_name = 'teach_card')),
  ('0014_set_folders',              exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'question_sets' and column_name = 'folder')),
  ('0015_affiliates',               exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'referred_by')),
  ('0016_new_password',             exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'must_change_password')),
  ('0017_plus_trial',               exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'trial_started_at'))
) as m(migration, done)
order by m.migration;
