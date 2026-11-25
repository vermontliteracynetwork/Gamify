-- Gamify 0014: an optional folder name on each question set, so teachers can
-- sort their sets into folders (teacher, 2026-11-24: "folders and editing
-- question sets"). Safe to run more than once.
alter table public.question_sets add column if not exists folder text;
