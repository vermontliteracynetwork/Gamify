-- Gamify 0012: the owner dashboard needs two-step sign-in, and the owner can
-- answer help requests (development plan Stage 7B). Run after 0011, AFTER
-- you have turned on two-step for your account on /owner (it walks you
-- through it): from then on owner powers need the authenticator code too.
-- Safe to run more than once.

-- Owner powers need the account flag AND a two-step session (aal2).
create or replace function public.is_owner() returns boolean
  language sql stable security definer set search_path = public
  as $$ select coalesce((select is_owner from public.profiles where id = auth.uid()), false)
            and coalesce(auth.jwt() ->> 'aal', '') = 'aal2' $$;

-- Replies to Tell Gamify messages; a teacher reads their own messages.
alter table public.feedback_reports add column if not exists reply text check (char_length(reply) <= 2000);
alter table public.feedback_reports add column if not exists replied_at timestamptz;
drop policy if exists "own feedback" on public.feedback_reports;
create policy "own feedback" on public.feedback_reports for select to authenticated using (user_id = auth.uid());

create or replace function public.owner_reply(fid uuid, body text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'owner only'; end if;
  update public.feedback_reports set reply = left(body, 2000), replied_at = now() where id = fid;
end $$;
revoke all on function public.owner_reply(uuid, text) from public, anon;
grant execute on function public.owner_reply(uuid, text) to authenticated;
notify pgrst, 'reload schema';
