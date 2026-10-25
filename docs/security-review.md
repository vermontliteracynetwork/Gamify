# Security review (launch readiness, Stage 8)

Reviewed 2026-10-25 by Claudia against the code in this repo and the
database migrations in `supabase/migrations`. Gamify today stores everything
on the device; the cloud database is written but not yet connected (the
network blocks supabase.co in this environment). This review covers both.

## Fixed in this review

| # | Finding | Severity | Fix |
|---|---|---|---|
| 1 | The 0001 profile policy let a signed-in teacher update every column of their own profile, so anyone could set `tier = 'pro'` (free paid plan) or `is_owner = true` (publish library themes, and later the owner dashboard). | High | `0003_lock_profiles.sql`: teachers can read their profile and change only `display_name`. Plan changes come from the billing webhook (service key); `is_owner` only from the Supabase dashboard. |
| 2 | No size limits on theme pictures or question sets: one account could store huge rows. | Medium | Size checks on `themes.data` (6 MB), `question_sets.questions` (2 MB) and feedback text fields. |
| 3 | A class could point its sign-in pictures at another teacher's private theme id. | Low | Classroom writes must use the teacher's own theme or a library theme. |

## Data access rules (row level security)

Every table has row level security on. A teacher sees and changes only their
own question sets, classes, students, assignments, question log rows,
settings and themes; public question sets and library themes are read-only
to everyone signed in. Anyone (even signed out) may send a Tell Gamify
report; only the owner reads them.

## Still to do when the cloud connects (Stage 5)

1. **Student sign-in and play without accounts.** Students have no login, so
   RLS blocks their devices from reading the class list or writing their
   answers. Plan: a Supabase Edge Function that takes a class code (or a
   game code), checks it, and returns a short-lived signed token scoped to
   that one class; question log writes go through the function. Rate limit
   code guesses there (the device already locks for 30 seconds after 5
   misses; the server must enforce it too).
2. **Picture passwords** are low-security by design (K-2 friendly). Keep
   them scoped to one class and never reuse them for anything else. A
   teacher can reset them any time.
3. **Tell Gamify spam.** Anonymous reports need a per-device and per-IP rate
   limit in the same Edge Function before launch.
4. **Owner dashboard sign-in.** The owner PIN is a device lock only. Before
   launch the owner page must require the owner's Supabase account
   (`is_owner`) with two-step sign-in, as the dev plan says.
5. **Service key** lives only in Vercel server environment variables, never
   in the app bundle or in chat. The browser only ever gets the public
   (anon) key.

## Backups

- Supabase Pro plan includes daily backups kept 7 days; turn on
  point-in-time recovery once there are paying schools.
- Once a month, download a backup and test restoring it into a scratch
  project (put it on the calendar).
- Teachers can export their own data any time (Account, Download my data),
  which also covers a single teacher's mistakes.

## Breach response plan

1. **Contain (first hour):** rotate the Supabase service key and anon key,
   revoke sessions, and take the affected part offline if needed.
2. **Assess (first day):** what data, which teachers and schools, how it
   happened. Student data in Gamify is a first name or nickname, picture
   passwords and answers; never emails, birthdays or addresses.
3. **Notify:** affected teachers and their schools without undue delay, and
   within the time any state law or school contract requires (many school
   data agreements ask for 72 hours; Vermont's law asks for 45 days at the
   most). The attorney confirms the exact duties before launch.
4. **Fix and write up:** close the hole, add a test, and post a short plain
   note on the status page.

## Already in place on the device

- Student pages load no outside scripts, set no cookies and call no outside
  servers (checked by `e2e/privacy.spec.ts` on every test run).
- No ads, trackers or analytics anywhere.
- Join codes use consonants only (no accidental words), expire after 14 days
  for game codes, and lock for 30 seconds after 5 wrong tries.
- Teachers can delete everything (Account, Delete my data).

## How the fixes were checked

The three migrations were run in order on a local PostgreSQL 16 with a stub
of Supabase's `auth` schema, then 0003 was run a second time to confirm it
is safe to repeat. Before 0003, a signed-in teacher could run
`update profiles set tier = 'pro', is_owner = true` on their own row and it
worked. After 0003 the same update is refused (permission denied), changing
the display name still works, a teacher can still make classes, and a class
that points at another teacher's private theme is refused.
