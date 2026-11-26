-- A payment-waived test account on the top plan (owner, 2026-11-26).
-- 1. Run migrations/0016_new_password.sql first.
-- 2. Supabase dashboard: Authentication, Users, Add user, Create new user:
--    the email and the starting password, with "Auto Confirm User" on.
-- 3. Put the email in both places below, paste this into the SQL Editor and press Run. It gives the account Pro
--    for good (no payment), and makes them choose their own password the
--    first time they sign in. The last line shows the result.
update public.profiles
set tier = 'pro', plan_until = null, plan_note = 'tester, payment waived', must_change_password = true
where id = (select id from auth.users where lower(email) = lower('PUT-THE-EMAIL-HERE'));

select u.email, p.tier, p.plan_until, p.plan_note, p.must_change_password
from auth.users u join public.profiles p on p.id = u.id
where lower(u.email) = lower('PUT-THE-EMAIL-HERE');
