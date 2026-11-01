-- Gamify 0013: a short teach card on each question set, shown before play
-- (market gaps, 2026-11-01). Safe to run more than once.
alter table public.question_sets add column if not exists teach_card jsonb;
