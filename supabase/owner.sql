-- Gamify: make yourself the owner. Run this AFTER migrations 0001 to 0004,
-- in the Supabase SQL Editor.
--
-- First create your login: Supabase dashboard, Authentication, Users,
-- Add user, Create new user (your email and a password, tick Auto Confirm).
-- Then put that same email below in place of YOUR-EMAIL and press Run.

update public.profiles
set is_owner = true, tier = 'pro'
where id = (select id from auth.users where email = 'YOUR-EMAIL');

-- Check it worked: you should see one row with is_owner = true and tier = pro.
select u.email, p.tier, p.is_owner
from public.profiles p join auth.users u on u.id = p.id;
