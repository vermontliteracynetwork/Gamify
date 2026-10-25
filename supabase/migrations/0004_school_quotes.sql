-- Gamify 0004: school and district quote requests from the pricing page
-- reach the owner dashboard as Tell Gamify reports of kind 'quote'.
-- Run after 0003. Safe to run more than once.
alter table public.feedback_reports drop constraint if exists feedback_reports_kind_check;
alter table public.feedback_reports add constraint feedback_reports_kind_check check (kind in ('bug', 'problem', 'idea', 'help', 'beta', 'quote'));
