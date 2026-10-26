-- Gamify: set one teacher's plan by username. Change the username and the
-- plan ('free', 'plus', 'pro' or 'homeschool'), then press Run.
update public.profiles set tier = 'plus' where username = 'vtliteracynetwork';

-- Check: one row with the plan you set.
select username, tier, is_owner from public.profiles where username = 'vtliteracynetwork';
