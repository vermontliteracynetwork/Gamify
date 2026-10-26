-- Gamify: give an account a username and a plan.
-- Accounts made in Supabase (Authentication, Users, Add user), like the
-- owner's, have no username, so they can only log in with their email.
-- Change YOUR-EMAIL, the username (3 to 20 lowercase letters, numbers,
-- periods or underscores) and the plan ('free', 'plus' or 'pro'), then Run.

update public.profiles
set username = 'vtliteracynetwork', tier = 'plus'
where id = (select id from auth.users where email = 'YOUR-EMAIL');

-- Check: your row should show the username and plan.
select u.email, p.username, p.tier, p.is_owner
from public.profiles p join auth.users u on u.id = p.id;
