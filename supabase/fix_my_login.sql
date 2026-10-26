-- Gamify: fix one account's log in. Sets a new password, confirms the email,
-- and gives the account a username and a plan.
-- Change all three YOUR-EMAIL, NEW-PASSWORD (8 or more characters), the
-- username and the plan, then press Run in the Supabase SQL Editor.
-- If the last line shows no row, the account does not exist yet: create it
-- in Authentication, Users, Add user (tick Auto Confirm), then run this again.

update auth.users
set encrypted_password = extensions.crypt('NEW-PASSWORD', extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'YOUR-EMAIL';

insert into public.profiles (id)
select id from auth.users where email = 'YOUR-EMAIL'
on conflict (id) do nothing;

update public.profiles
set username = 'vtliteracynetwork', tier = 'plus'
where id = (select id from auth.users where email = 'YOUR-EMAIL');

-- Check: one row with confirmed = true, your username and plan.
select u.email, u.email_confirmed_at is not null as confirmed, p.username, p.tier, p.is_owner
from auth.users u left join public.profiles p on p.id = u.id
where u.email = 'YOUR-EMAIL';
