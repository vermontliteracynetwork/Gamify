# Upgrade strategy: locked features, the welcome screen and the beta filter

Marketing Director, 2026-11-26, with the economy-designer and Design Chair views.
Owner request (word for word): "the teams need to determine a promotional strategy for
the features that are locked for the free and plus plans (making sure they visable but
behind a paywall) so people want them. on sign up, it would be good to show things theyd
get if they upgraded to a paid plan right then. we want to make it easy and almost obvious
to sign up for the paid plans so we make more money and have more sign up conversions
which is always a goal" and "we need to make sure people arent signing up for the beta
test to play and then not do anything, but i also want to make sure that we get people
signed up even if they dont want to beta test offically."

Status: **needs-ok** (planner campaign `c-upgrade`; Waiting on you `mkt-upgrade-strategy`).
No app code was changed. Teacher pages only: nothing here ever appears on a student page
or on a screen the class can see.

Lessons applied: 2026-11-24 "check every number against the code" (Free plays 4 of the 8
listed games, not 7); 2026-11-25 "check who can actually get a printable before calling it
free" (only Game Show templates on Free); 2026-11-25 "UTM links measure visits, not
sign-ups" (so today we cannot count which lock sells; see section 4).

---

## 0. The advisor view (read this first)

- **The assumption under the request:** more prompts mean more paid plans. Research says
  the opposite past a point: repeated, pushy prompts cause reactance (Brehm, 1966: people
  resist when they feel their choice is being taken) and banner blindness (habituation),
  and teachers who feel nagged tell other teachers. What sells is a prompt at **the moment
  of need**, right after the teacher has felt the value (Fogg Behavior Model: motivation x
  ability x prompt).
- **The trade-off:** "almost obvious" to pay is good; "hard to say no" is a dark pattern
  and, for a brand schools must trust, an expensive one. The line we hold: the paid choice
  is the brightest; the free choice is always a full, plain button.
- **A weak spot to name:** our own research found that free tiers that feel too tight (one
  competitor's 3-activity cap) are what teachers complain about most
  (`docs/competitor-plans-research.md`, section 2). Our Free plan caps saved sets at **3**:
  the same shape. It will drive upgrades and complaints. Section 1 softens it (the meter,
  the library); keep or raise the cap is your call.
- **How it fits your goals:** paid plans (yes), a brand schools trust (only if the student
  side stays clean and cancel stays easy), a business you can run (the beta filter must
  run itself, not need you to chase ten teachers).

---

## 1. Every locked feature: where it shows, the hook, the moment, the prompt

Checked against `src/config.ts` (TIERS, FREE_GAMES), `src/public/CompareChart.tsx` and the
screens that already show a lock (`ActivityPage`, `HostDialog`, `ThemeBuilderPage`,
`ClassPage`, `ClassesPage`, `QuestionSetsPage`, `ReportsPage`, `LiveHost`, `ClassView`,
`templateAccess`, `SignInGate`) on 2026-11-26.

### The five prompt patterns (teacher pages only)

| Id | Pattern | What it looks like | Research |
|---|---|---|---|
| P1 | **Lock + plan chip** | The feature stays in full color and tappable, with a small lock and a pill that says **Plus** or **Pro** in its corner. Never grayed out on teacher pages: gray reads as "broken", color reads as "want". Lock is a shape plus a word, never color alone. | Von Restorff isolation effect; Gestalt proximity (chip sits on the thing it unlocks); WCAG 2.1 1.4.1 (not color alone) |
| P2 | **Peek sheet** | Tapping a locked item opens one `Dialog`: a short loop or screenshot of the real feature (a still image when Reduce motion is on), one value line, the plan it comes with, the price **with its renewal line**, and three buttons: **Get Plus** (Grape), **Not now** (white), **Compare plans** (link). | Curiosity gap (Loewenstein, 1994) paid off at once; processing fluency; ROSCA clear disclosure |
| P3 | **Limit meter** | Counts are always visible before the wall: "2 of 3 question sets", "28 of 30 students". No surprise at the wall. | Goal-gradient effect (Hull; Kivetz et al., 2006); transparency builds trust |
| P4 | **Before-work wall** | The prompt comes when the teacher taps **New set** (the 4th), not after she has typed 20 questions. Her work is never held hostage. | Ethics: avoids "forced action" (FTC staff report on dark patterns, 2022, from memory); endowment effect used honestly |
| P5 | **After-class card** | After a game that went well, the teacher's own Home or Reports page (never the results box the class sees) shows one card: what Plus would have added to that game. | Peak-end rule (Kahneman): ask right after the best moment |

**Rules for every prompt** (economy-designer and Design Chair):
- **Never on a screen the class can see.** The Share stage, the live lobby with its code,
  the results box and the live host screen can all be on a projector. There a locked item
  shows only P1 (lock + chip), no price, no dialog that opens by itself. Prices appear
  only after the teacher taps. (Same reason students never see prices: bible 7, product
  plan 5 principle 2.)
- **Never during a live game.** "Remind me after class" moves it to P5.
- **One unasked card a session**; a feature she dismissed stays quiet for 7 days.
  Prompts she taps herself (P1, P2) are never capped.
- **Every price in the app carries its renewal line** ("renews every year at $76.80 until
  you cancel"), as bible section 12 already requires in posts.
- **Accessibility is never locked, and never shown as an upgrade.** (Bible core message 3.)

### Free, locked until Plus (or Pro)

| Locked feature (Free) | Where it shows today | Change to | Hook line (in-app, value first) | The upgrade moment |
|---|---|---|---|---|
| **4 of the 8 listed games** (Board Game, Bubble Pop, Bowling, Territory; Free plays Game Show, Match Three, Four in a Row, Question Tracker) | Lock on the cover in Create an Activity and Host; the locked-game page | P1 chip "Plus" on each cover in full color; P2 peek with a 10-second loop of that game; optional **Teacher test drive**: the teacher plays one round herself with sample questions, never with students | "Your questions, 4 more ways to play. Board Game, Bubble Pop, Bowling and Territory come with Plus." | Picking a game for an activity, and the second week of play (variety need) |
| **Theme Builder for every game** (Free: Game Show only), student design studio for every game, theme templates for every game | Builder game list lock; trial note; template lock | P1 on each game in the Builder; P2 peek shows a class-made theme on the real board; P5 after the first Game Show theme is done | "Your class designed Game Show. With Plus they design a theme for every game." | Right after finishing the first Game Show theme (IKEA effect, Norton et al., 2012: people value what they made) |
| **Classes** (Free: one student list) | Create an Activity note; Classes page | P1 on "Add a class"; P2 explains results saved by class | "Teach more than one group? Plus keeps 3 classes apart, each with its own results." | Adding students past one group, or a second period |
| **Students past 30** | Class page over-limit note | P3 meter "28 of 30"; P4 at the 31st | "Room for everyone: up to 60 per class on Plus." | Adding the 31st student |
| **Saved question sets past 3** | Sets page limit note | P3 meter from the first set; P4 at **New set** for the 4th, with the ready-made library offered first | "You have made 3 sets. Plus keeps as many as you write. Or play any ready-made set now." | Tapping New set the 4th time |
| **More than 1 set assigned per student** | (limit) | P4 when assigning a 2nd | "Assign up to 5 sets at once on Plus." | Assigning a second set |
| **Live monitor and Lock** | Live class view note | P1 only during the game (it may be projected); P5 after class: "Next live game, Plus shows you who is stuck while they play" | "See who is stuck, lock one screen or all, send a private nudge." | The first live game where she wished she could see who was stuck (after class, never during) |
| **Class lobby leaderboard or one class goal**, **groups each with their own game** | Live host setup note | P1 + P2 with a still of the class goal | "Race on a leaderboard, or work together toward one class goal." | Setting up a lobby |
| **Report history past 30 days** | "Keep every report" button on Reports | P3 "showing your last 30 days"; P2 states the truth: older reports are kept, not deleted; Plus shows them | "Your reports from before [date] are still saved. Plus shows every one, so you can see growth all year." | Parent conferences, report cards, an IEP meeting (loss aversion, said truthfully) |
| **Homework due more than 14 days ahead** | Due date picker | P1 on far dates in the picker | "Set any due date on Plus." | Picking a date past 14 days |
| **Upload your own sign-in pictures** | Class page note | P1 + P2 | "Use your own pictures for sign-in on Plus." | Editing a student's picture |

### Plus, locked until Pro

| Locked feature (Plus) | Where it shows today | Change to | Hook line | The upgrade moment |
|---|---|---|---|---|
| **A game for each student** and **choice boards** | Create an Activity way-to-play cards, lock + "Pro only" note | P1 chip "Pro" in full color; P2 peek with a still of a choice board | "Let every student pick their game, or give each one their own." | Planning centers, stations or differentiated review |
| **More than 1 theme per game** | Builder | P4 when starting a 2nd design for one game | "Keep every theme your class dreams up on Pro." | Starting a second design for the same game |
| **More than 3 classes, more than 60 per class, more than 5 sets assigned** | Limit notes | P3 meters; P4 at the wall | "No limits on classes or students on Pro." | Adding the 4th class |
| **A fresh class lobby code each time** | (row in chart) | P1 in lobby settings | "A new code every time the lobby opens." | Opening the lobby |
| **New games before anyone else** | Pricing and chart only | **Do not promote yet.** No early-access setting exists in the code (checked 2026-11-26). Truth check fails until it ships or you define it. | (none) | (none) |
| Plus to Pro price | Upgrade box | Show only the difference per month; "pay only the difference" only if Stripe prorates (your decision once Stripe is set up) | "Everything in Plus, with no limits, for $7 more a month." | Any Pro wall |

### Gaps the dev team should close first (no code changed here)
1. The upgrade box (`src/billing/Upgrade.tsx`) shows only the yearly price as "Billed
   yearly at $76.80": no renewal line, no monthly, 3 or 6-month choice, no launch-sale
   line. Before Stripe it must match the Pricing page and ROSCA disclosure.
2. Locked game covers in Create an Activity and Host show a lock but no plan chip and no
   preview (P1, P2).
3. There is no welcome screen after sign-up: `LoginPage` goes straight to `/teacher`
   (section 2 below).
4. Nothing counts paywall views or taps, so we cannot learn which lock sells (section 4).
5. `FREE_GAMES` still lists 3 hidden games; any copy must count listed games (4 free of 8).

---

## 2. The sign-up flow, the beta choice and the beta filter

### The welcome screen (right after the sign-up form, one screen, one decision)
Owner rule (2026-11-26) asked for a beta pop-up after the first sign-up screen and,
separately, a "what you'd get" screen. **Two pop-ups in a row is the weak spot**: each extra
step loses people (Hick's law, Fogg ability), and a beta pop-up sitting before the plans
sends would-be payers to a free 3-month offer. So: **one welcome screen, titled "How Do You
Want to Start?"**, standard Gamify look, three choices in this order:

1. **Plus** (the bright card): its four headline lines (from `upgrade.plus.1-4`), the
   price for the length picked (monthly / 3 / 6 / 12, yearly first as on Pricing), the
   **Founding Subscriber** line while it is true ("an extra 10% off your first term until
   January 1, 2027; then it renews at the standard price for the same length until you
   cancel"), and **Get Plus** (Grape).
2. **Pro** beside it, same layout, quieter card.
3. **Start Free** as a full, yellow go button (your button rule: "Start free" is a go
   action), with "Free forever. No card needed." No "No thanks, I'll skip the good stuff"
   wording, ever (confirmshaming).

Below the three, **only during the beta window (until February 28, 2027, owner 2026-11-26) and only while spots remain**, one strip:
"Want to help build Gamify? Apply to be a beta tester: Pro free for 3 months in return for
playing twice a week and short surveys. 10 spots, chosen by the founder." **Apply** opens the
formal application page `/beta/apply` (being built separately; not part of this plan). If the teacher arrived from a beta post (`/beta` in her path), the strip
moves to the top. One discount shows at a time: the launch sale, or an affiliate's 10%,
never both (`docs/affiliate-program.md`).

Research: default effect and anchoring (Johnson and Goldstein, 2003, from memory): the
highlighted card and yearly-first shape the choice without removing it; choice overload
(Iyengar and Lepper, 2000, from memory): three options, not six; reciprocity: Free is
real and stated first in words.

### Why freeloading the beta is mostly blocked already, and what to add
Applying gives nothing by itself: Pro comes only by the beta code, sent only to testers
you approve (`beta-code`, 10 uses). The real risk is **approved testers who go quiet**.

| Filter | How it works | Trade-off |
|---|---|---|
| 1. **Work-first framing** | The strip and /beta say what it costs in time (twice a week, 3 surveys, check-ins) before what it gives. A teacher who wants free Pro without work self-selects out. | Fewer applicants; better ones |
| 2. **Sharper application** | Add: "When will you first play with a class?", "How many students and what devices?", and a tick for "I will host 2 games a week". | 30 more seconds to apply |
| 3. **Show-us-one-game gate** | Applicants start on Free (or the trial); you approve those who have hosted one real game (the owner Beta page can see it). | Slower start; strangers from groups may drop. Commitment and consistency (Cialdini; foot in the door, Freedman and Fraser, 1966) |
| 4. **Earned months** | Pro for month 1; months 2 and 3 continue at each check-in if the checklist pace is met (for example 4 games hosted and 2 after-game forms by day 30). Stated in the agreement before they accept. | Changes the public "Pro free for 3 months" promise: /beta must change before new applications, and testers already approved keep their terms |
| 5. **Check-ins with a waitlist** | Weekly check-in (`/beta` check-in page exists). Two missed in a row: a friendly note. Three: the spot goes to the waitlist, said up front. | You (or the beta lead) must read check-ins weekly |
| 6. **"Not picked" converts** | Every applicant not chosen gets a kind email: thanks, the Founding Subscriber sale, and (if you choose it) the trial. | None; this is where non-beta sign-ups convert |

Recommended: 1, 2, 5 and 6 now (no promise changes); 3 or 4 is your call.

### The reverse-trial option
**Everyone who does not join the beta gets Plus free for N days, no card, then moves to
Free.** No card means nothing ever bills on its own, so it is not a negative option.

| For | Against |
|---|---|
| Endowment effect (Kahneman, Knetsch and Thaler, 1990) and loss aversion: teachers feel every game, theme and the live monitor, so Free feels like a step down, not a starting point | **The Monday problem:** a teacher plans a lesson on Bubble Pop, the trial ends, and the game is locked in front of 25 kids. Feels like bait and switch; the trust cost lands on the brand schools must trust |
| The IKEA effect: themes they design in the trial pull them back | Downgrade rules must be exact: extra sets, classes and themes stay saved and readable ("Nothing is ever deleted" is already promised) |
| Reverse trials are a known growth pattern (Elena Verna, via search results; her conversion figures are her own reports, not studies, so we do not use them) | School calendar: a 14-day trial that starts Dec 18 dies over winter break |
| Teachers who never pay still finish on a real Free plan, so the pipeline stays | Less reason to subscribe before Jan 1 if the trial outlasts the launch sale |

If you choose it, the safe shape: **Plus (the plan we recommend), 30 days, starting the
first time she hosts a game** (not at sign-up, so break and planning weeks do not burn it);
reminders on day 23 and day 28 on her teacher pages and by email; **nothing locks during a
live game**, and homework links made in the trial keep working until their due date; the
launch-sale price holds for anyone who signed up before Jan 1 until their trial ends (your
call). On the welcome screen it replaces "Start Free" with "Start With 30 Days of Plus
Free" and a line: "Then Free forever, unless you choose a plan. No card needed."
Alternatives: no trial (Free + P2 peeks + teacher test drive), or a trial only for
teachers who have hosted 2 games on Free (rewards activation).

### Numbers to watch (definitions; no targets until 4 weeks of data, first test)
- Welcome screen split: Plus, Pro, Free, beta apply.
- **Activation**: first activity run within 7 days (bible 0, the Use stage).
- Per lock: P2 opens, Get Plus taps, checkouts started, paid. Which lock sells.
- Paid conversion within 30 and 60 days of sign-up; launch sale use.
- Trial (if chosen): trials started (hosted a game), trial to paid, and **Free actives
  30 days after a trial ends** (did the downgrade lose them?).
- Beta: applications, approved, testers still hosting 2 games a week at week 2 and week 6,
  check-ins and surveys sent, testers who pay after the offer.
- **Guardrails** (a rise is a stop sign): prompt "Not now" rate, cancels in the first
  term, refund requests, complaints about nagging, and prompts shown on a projected screen
  (must be zero).
- Measurement gap: none of this is counted today. It needs first-party event counts on
  teacher pages only (no third-party trackers, nothing on student pages), and utm_source
  kept through sign-up (lesson 2026-11-25). Your decision.

---

## 3. Ethics and legal checks

| Check | Result |
|---|---|
| **Click-to-cancel** | The FTC's 2024 click-to-cancel rule was vacated by the Eighth Circuit in July 2025 (law-firm summaries in search results; pages not opened, the hosts were blocked this session). **Still binding:** ROSCA (clear terms before billing, express consent, simple cancel), FTC Act section 5, the 1973 negative option rule, and state automatic-renewal laws, many as strict as the vacated rule. We design to the stricter standard anyway: cancel online as easy as sign-up (already in `billing-intervals`). |
| **No dark patterns** | Pass as written: no fake timers (the Jan 1 date is real), no confirmshaming ("Start Free" and "Not now" are plain), no pre-ticked paid choice, no card for Free or the trial, no nagging (frequency cap), no work held hostage (P4 before work), prices always with renewal terms. Bible 5 ethics line. |
| **Recommended label** | You asked to remove the "Recommended" label on Pricing (2026-11-26, "pricing=a but remove the recommended label"). The upgrade box still says "Best fit". The welcome screen above uses the brighter card only, no label, to match you. Decision 4. |
| **COPPA and student pages** | Untouched. The amended COPPA Rule's compliance date was April 22, 2026 (Federal Register notice, via search results). Nothing here adds student data, student-page prompts, prices or "buy" words. Verified 2026-11-26: student Home redirects to Join; the locked-game page shows Upgrade only to a signed-in teacher. Projected screens get the no-price rule above. The 2021 FTC complaint about paid prompts shown to children (`docs/competitor-plans-research.md` section 3) is why. |
| **Accessibility** | Never locked, never shown as an upgrade. Peek loops respect Reduce motion; locks are icon plus word. |
| **Endorsements** | Beta testers who post say they got Gamify free (bible 7.4; FTC Endorsement Guides). |
| **Truth** | "New games before anyone else" (Pro) has no mechanism in the code: pulled from prompts until it ships. Free game count is 4 of 8 listed. |

---

## 4. Decisions only you can make
1. **Reverse trial: yes or no** (still open; kept as an option), and if yes, Plus or Pro, and how many days (we suggest
   Plus, 30 days, starting at the first hosted game).
2. **Beta filter**: add the show-us-one-game gate, the earned months (changes the public
   3-month promise), both, or neither.
3. **The 3-set Free cap**: keep it (more upgrades, more complaints) or raise it.
4. **The welcome screen**: one screen with the beta strip under the plans (recommended),
   or your beta pop-up first; and should "Best fit" leave the upgrade box to match your
   Pricing call.
5. **Counting**: first-party event counts on teacher pages and keeping utm_source through
   sign-up, so we can see which lock sells.

Sources (search results, not opened in full; page fetches were blocked this session):
DLA Piper, "FTC's click-to-cancel rule voided" (2025-07-16); Greenberg Traurig, "Eighth
Circuit vacates FTC's click-to-cancel rule"; WilmerHale (2025-08-01); Federal Register,
Children's Online Privacy Protection Rule (2025-04-22); Amplitude and CXL on reverse trials.
Everything marked "from memory" was not opened.
