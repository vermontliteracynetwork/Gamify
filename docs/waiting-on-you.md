# Waiting on you

Things only Kayden can do (money, accounts, legal, going live). The same list shows first on the owner desktop (`/owner`) every time it opens, with a box to tick each one. Source of truth: `src/owner/waiting.ts`; Claudia adds to it in the same change that finds the need.

**Start Gamify LLC, in this order (your decision, 2026-11-19: a separate company from VLN, started now, before money or contracts touch Gamify; replaces running it under Vermont Literacy Network LLC).**
1. **Form Gamify LLC.** Vermont Secretary of State website, Articles of Organization (small fee, yearly report after; check current fees).
2. **Get its EIN.** IRS website, Apply for an EIN online. Free, about 10 minutes.
3. **Move Gamify into the LLC.** Attorney drafts a one-page assignment of the code, name, logo and designs from you and VLN to Gamify LLC; sign it, then tell Claudia so the legal drafts change names.
4. **Open the bank account** in Gamify LLC's name.
5. **Buy learngamify.com** in Gamify LLC's name, after a quick trademark search (open on 2026-11-19, about $12 a year); add it to the Gamify project in Vercel. Students join at learngamify.com/join, which already works.
6. **Open Stripe** in Gamify LLC's name with its EIN and bank account; confirm prices ($96 and $180 a year) and add the keys to Vercel.
   Then **turn on the signed payment webhook (2026-11-20):** Stripe, Developers, Webhooks, add https://<your domain>/api/stripe-webhook (checkout.session.completed, customer.subscription.updated and .deleted, invoice.payment_failed) and put its signing secret (whsec_...) in Vercel as STRIPE_WEBHOOK_SECRET. Only signed events get through.
7. **Later: ask an accountant about the S corp election** once Gamify has steady profit (IRS Form 2553).

**Everything else**
- **Security: four switches only you can turn on (2026-11-20).** Supabase Authentication: Leaked password protection, MFA (TOTP), Bot protection (Turnstile; send Claudia the site key). Vercel: a Spend Management cap. OpenAI: a monthly usage limit. Full list: docs/security-audit.md.
- **Co-op codes: run 0014 and add the 25% Stripe coupon (2026-11-20).** Your pick: option B, 25% off with the co-op's code. Supabase SQL Editor: run supabase/migrations/0014_coop_codes.sql; make each co-op's code on /owner, Access codes; once Stripe is open, add a 25% off coupon named "Co-op 25".
- **Approve the design mockups (2026-11-19).** The Gamify Design Audit page (https://claude.ai/artifact/9XVLS1bFUy2UDzP3qVZD8F), Mockups tab: the right-answer moment, setup steps, one top bar, scoreboard (laptop and iPad portrait) and team results box. Also: keep numbers on Game Show cards? Keep the slashed zero?
1. **Attorney review.** We sell to schools, so every public promise needs a lawyer's eye. How: Terms, Privacy, the beta tester agreement, the Theme Building Challenge rules and its parent permission slip (/challenge/permission), the accessibility conformance report, the student data privacy agreement template, naming other products for compatibility (Google Sheets, Google Classroom, Canva), the Common Core text license, DMCA agent registration.
2. **Line up 2 to 4 beta test classrooms.** Real classrooms give the feedback, quotes and the screen reader check on iPads that schools ask for. How: Send the Join the beta test page to teachers you trust; the classroom kit is at /beta-kit.
3. **Demo video: voice-over and classroom footage.** The 80-second rough cut is ready; the final needs a voice and real classrooms (with signed releases). How: See docs/demo-video-plan.md.
4. **Check insurance before schools pay.** Districts often ask for proof of general liability and cyber coverage. How: Ask your insurer whether the LLC policy covers software, and add cyber and errors-and-omissions cover if not.
5. **Confirm Claudia's guesses.** Claudia predicted these from your past answers and built them; change any you disagree with. How: school plans include a free online kickoff for teachers; we sign district data privacy agreements; school invoices go out within one school day; starter themes play on Plus and Pro; Pro's early access means new games open to Pro a few weeks early.
- **Run 0007 so accounts can hold the Homeschool plan (2026-10-26).** Price set: $8 a month ($96 a year). Live monitor and Lock are guessed on. How: Supabase SQL Editor, run supabase/migrations/0007_homeschool_plan.sql (skip if already run).
- **Run 0008 so students can join from their own devices (2026-10-26).** How: Supabase SQL Editor, run supabase/migrations/0008_game_codes.sql.
- **Run 0009 so homework links keep working until their due date (2026-10-26).** How: Supabase SQL Editor, run supabase/migrations/0009_homework_due.sql.
- **Run 0010 so the developer dashboard shows real numbers (2026-10-27).** How: Supabase SQL Editor, run supabase/migrations/0010_owner_dashboard.sql, then open /owner signed in as vtliteracynetwork.
- **Turn on quote emails, after the domain (2026-10-27).** Make a free Resend account, verify the domain, add RESEND_API_KEY, QUOTE_FROM (for example Gamify <quotes@learngamify.com>) and QUOTE_BCC (your email) in Vercel, redeploy. Until then, quote requests show on /owner with a Download this quote as a PDF button.
- **Run 0011 to switch on access codes and beta plans (2026-10-27).** Supabase SQL Editor: run supabase/migrations/0011_access_codes.sql (after 0010), then make the code on /owner (Access codes and beta plans) and send it to your list.
- **Turn on two-step sign-in for /owner, then run 0012 (2026-10-27).** After 0010: log in as vtliteracynetwork, open /owner, scan the QR code with the authenticator app on your phone, type its code. Then run supabase/migrations/0012_owner_two_step_and_replies.sql.
- **Turn on the natural read-aloud voice, optional (2026-10-27).** Make an OpenAI API key and add it in Vercel as OPENAI_API_KEY (Production), then redeploy. Only on-screen words are sent. Without it, read-aloud uses the device voice.


