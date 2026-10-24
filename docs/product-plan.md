# Gamify: Commercial Product Plan (brainstorm v0.1, 2026-10-24)

Status: **brainstorm, not decided.** This is Claudia's first pass at how
Gamify comes together as a product you can sell. Anything marked
**DECIDE** needs your answer before it gets built. Where this conflicts
with `platform-spec.md`, this doc is the newer thinking.

> Not legal advice. Section 6 is a checklist of what to get right and what
> to ask an attorney, written so nothing gets missed. Book an IP + ed-tech
> privacy attorney review before taking the first payment.

---

## 1. What Gamify is (one sentence)

**A teacher writes one question set, and Gamify turns it into dozens of
games and activities, played four ways (whole class on their own devices,
whole class on one shared screen, solo, or head to head), all wearing the
theme the teacher (or the class) picks.**

What it borrows, by *kind of experience* (never code, art, names or look):

| Inspiration | The experience we want | What Gamify adds |
|---|---|---|
| Baamboozle-style | Team-vs-team board game run from the front of the room | Themes, calm mode, read-aloud on every screen |
| Blooket-style | Every kid plays their own arcade game; answering powers the game | The proven question-break engine from the Independent Work Dashboard |
| Wordwall / Flippity-style | One content list becomes many simple activity formats (match, sort, flashcards, spinner) | Same question set feeds both activities and arcade games |
| Independent Work Dashboard | 20+ arcade games already built around one question screen | Gamify starts from this logic instead of from zero |

The moat is not any single game. It is: **one content source, many game
modes, one theme system across all of them, and accessibility good enough
for students with high support needs.**

## 2. Four play modes (all powered by question sets)

Direct from you (2026-10-24): every game is fueled by question sets and
comes in up to four modes. Every game module declares which modes it
supports. Activity formats (Wordwall / Flippity-style) are not a separate
mode: they are games that plug into these same four modes.

| # | Mode | Who holds a device | Feels like | Needs a server? |
|---|---|---|---|---|
| 1 | **Class Live** (whole group, own devices) | Every student + teacher host | Classic Blooket hosting | Yes (real-time) |
| 2 | **Share** (whole group, one screen; 1 to 10 teams, or the class vs the CPU or the teacher) | Teacher only, cast or on the board | Baamboozle | No |
| 3 | **Solo** | One student | Dashboard arcade games, homework | No |
| 4 | **Versus** (student vs student, or vs CPU) | One shared device, later two devices | Board-game night | No (shared device); yes (two devices) |

### Mode 1: Class Live (whole group, independent devices)
- Teacher opens a game + question set and gets a **join code** and QR code
  on the big screen (or hosts from their own laptop/iPad).
- Students join on their own iPads with the code and a nickname. Teacher
  approves or renames nicknames before the game starts (and a built-in
  word filter blocks bad names).
- Each student plays **their own copy** of the game: answering powers it,
  exactly like Solo. The teacher screen shows the **lobby, live
  leaderboard, timer, and class progress**.
- Teacher controls: start, pause everyone, add time, end, remove a player.
  Option to hide the leaderboard (top 5 only, or no ranks, just a class
  goal bar) so struggling students are not shamed in front of the class.
- Team option: students are put in teams and the board shows team totals.
- End screen: podium (or class-goal celebration), then a teacher report
  of who got which questions right.

### Mode 2: Share (whole group, cast from the teacher's device)
- No student devices at all. Teacher puts the game on the board (casting,
  projector, smartboard) and drives it from one device.
- **1 to 10 teams** take turns. On a team's turn the question shows big,
  read aloud if wanted; the class answers out loud or with whiteboards;
  the teacher taps **right** or **not yet** (or the team taps an answer on
  a smartboard).
- A right answer earns the team its game move: pick a surprise card,
  drop a ball, bowl a frame, claim a square.
- Built for the room: huge text readable from the back, team colors and
  icons (not just names) so K-3 kids know whose turn it is, a big
  "whose turn" banner, undo for teacher mis-taps.
- Zero setup and works on any school's tech, which makes it the strongest
  free-tier hook.
- **One team vs a challenger** (direct from you, 2026-10-24): with one
  team, the other side is played by:
  - **the CPU**: "The whole class vs the computer." The CPU plays its
    game moves (Easy / Medium / Hard); the class answers the questions.
  - **the teacher**: "The whole class vs Ms. ___." The teacher takes the
    other side's turns on their device (and can quietly make it close).
  Both turn the whole room into one team with a shared goal, the
  cooperative structure the research favors over student-vs-student
  ranking (see `docs/gamified-learning-research.md` 3.5 and
  `docs/settings-equity-research.md` section 8).

### Mode 3: Solo
- One student, one device: the Dashboard arcade model. Game runs, pauses
  for the question screen, a right answer powers the game.
- Entry points: a homework/assignment link, a classroom center, or free
  play. Assignment lock rules from `docs/question-engine.md` apply.
- Also covers single-player activities (flashcards, match up, sort).

### Mode 4: Versus (student vs student, or student vs CPU)
- **Pass-and-play first:** two players (up to four for some games) on one
  iPad, taking turns. Each turn starts with that player's question.
- **Vs CPU:** a computer player with three levels (Easy, Medium, Hard)
  that plays the game moves; it never answers questions, the student
  always does. CPU is a friendly character, never gloats or teases.
- **Two devices later:** student vs student on separate iPads with a short
  match code, using the same real-time server as Class Live.
- Kindness rules: both players earn for every right answer whoever wins,
  the loser screen says "Good game! Rematch?", and a handicap option lets
  the teacher give one player a head start or extra support.

### The big build insight: two engines, not four
- **"Everyone plays their own game" engine** powers Solo (3) and Class
  Live (1). Class Live is Solo plus a host screen that collects scores.
  So every Solo game we build becomes a Class Live game almost for free.
- **"Take turns" engine** powers Share (2) and Versus (4). A turn
  player can be a team, a student, the CPU or the teacher. So every turn-based game we
  build works in both modes.

## 3. Starting game roster (from the Dashboard, renamed)

These are the Dashboard's arcade games. Mechanics are generic and fine to
rebuild; **several current names are other companies' trademarks and must
change before anything ships.** Proposed working names only, all pending a
trademark search:

| Dashboard game | Problem with the name | Gamify working name | Modes (1 Live, 2 Show, 3 Solo, 4 Versus) |
|---|---|---|---|
| Plinko | "Plinko" is a registered trademark (game show) | Peg Drop | 1 2 3 4 |
| Crossy Road Hopper | "Crossy Road" is a registered trademark | Road Hop | 1 3 |
| Diner Dash | "Diner Dash" is a registered trademark | Lunch Rush | 1 3 |
| Bakery Match (match-3) | Fine, but must not resemble any famous match-3 look | Bakery Match | 1 3 |
| Bubble Shooter | Generic term, fine | Bubble Pop | 1 3 |
| Castle Defense | Generic, fine | Castle Guard | 1 3 |
| Space Bowling | Generic, fine | Space Bowling | 1 2 3 4 |
| Slime Chess | Chess is public domain, fine | Slime Chess | 2 4 |
| Shape Dash | Close to a famous rhythm-runner name, avoid | Shape Runner | 1 3 |
| Farm Grow, Memory Match, Pet Show Ring, Quiz Mode, Lighthouse Signal, Gem Mine, Kitchen Cook-Off, Word Search, Cupcake Tycoon, Doc Fishing, Rescue Shelter, Alchemy | Generic, fine (double-check each in the search) | Keep | Mostly 1 3; Memory Match and Quiz also 2 4 |

Also on the Wordwall/Flippity side, avoid board-game trademarks: no
"Jeopardy" (use Category Board), no "Connect 4" (Four in a Row), no
"Chutes and Ladders" (Climb and Slide; snakes-and-ladders itself is a
centuries-old public domain game), no "Hangman" (also avoid for tone: use
a melting snowman or a rocket launch countdown instead).

New games made for the turn-based modes (2 Show, 4 Versus):

| Game | Modes |
|---|---|
| Team Board (pick a surprise card) | 2 |
| Category Board | 2 |
| Four in a Row | 2 4 |
| Tic-Tac-Toe | 2 4 |
| Climb and Slide | 2 4 |
| Find the Match race | 1 3 4 |
| Match Up, Group Sort | 1 3 |
| Flashcards | 3 |
| Spinner Wheel | 2 |

**DECIDE:** which three games ship first. Claudia's pick covers all four
modes with the fewest games:
1. **Peg Drop** (modes 1, 2, 3, 4: one game proves both engines)
2. **Team Board** (mode 2, no devices, the strongest free hook)
3. **Match Up** (modes 1, 3: cheapest activity, proves the content
   pipeline)

## 4. Themes across every game (headline paid feature)

### What a theme is
A theme is a data pack, not code. Every game reads from it, so one theme
re-skins all games at once:

- **Palette tokens** (background, surface, accent, text, success, miss),
  validated for contrast automatically
- **Font pair** (from an approved, licensed list only)
- **Backdrop** (stage background art or pattern)
- **Skin slots**: every game declares the same named slots, and the theme
  fills them: `player`, `goal`, `obstacle`, `collectible`, `projectile`,
  `card-back`, `celebration`
- **Sound pack** (right, miss, win, tap), procedural or licensed
- **Celebration style** (confetti, stars, bubbles, fireworks), always with
  a calm-mode version

Example: an "Ocean" theme makes Peg Drop's ball a pearl, Bubble Pop's
bubbles real bubbles, Road Hop's hopper a crab, Match Up's card backs
shells. Teacher picks it once.

### Theme tiers
- **Free:** 3 house themes (e.g. Classic, Space, Garden)
- **Pro:** full theme library plus seasonal drops (fall, winter, spring,
  field day; secular by default, no specific holidays unless chosen)
- **Pro:** **Theme Builder**: school colors, class mascot, uploaded images
  for skin slots. Uploads require a "I own this or have permission" check
  box and go through moderation rules (see section 6)
- **Later:** **Class-designed themes**: students design a theme as a
  project (ties directly into `docs/junior-designers-plan.md`), teacher
  publishes it for their class

### Non-negotiables for every theme
- Passes contrast checks (builder refuses colors that fail)
- Has a calm version (reduced motion, softer celebration, quieter sounds)
- Never changes where buttons are or what shape they are: a K-3 student
  must find "answer," "next" and "menu" in the same place in every theme
- No blood, no scary content, nothing a teacher would be embarrassed by

**DECIDE:** themes skin the *game stage* only, while the platform chrome
(menus, teacher pages, question screen layout) keeps the locked Gamify
brand. Claudia recommends yes: it keeps navigation predictable for young
students and keeps the brand recognizable. This also resolves the conflict
with the "dark theme, locked, one accent" rule in `CLAUDE.md`: that rule
would apply to chrome, not to themed game stages.

## 4A. Settings on every game, on every device (accessibility, free)

Direct from you (2026-10-24): every game has comprehensive settings, usable
from every device, reachable at any point in the game. Research behind
every item: `docs/settings-equity-research.md`.

**The gear button.** One gear, same corner, same look in every game and
every theme. Tapping it pauses the game (solo and versus; in Class Live it
opens without stopping the class). Works by touch, keyboard and switch
access, iPad-fingertip size.

**What's inside (every game, all free):**

| Group | Settings |
|---|---|
| Sound | All sound off switch; Sound effects (Off + 5 levels); Background music (Off + 5 levels); Voice / read-aloud (Off + 5 levels, speed); every sound has a visual partner so nothing is lost with sound off |
| Haptics | On / Off (shown only on devices that can vibrate; iPads cannot, Android can); never the only signal |
| Visual stimulation | One-tap **Calm mode**; Motion (Full / Gentle / Still); Celebrations (Big / Small / Off); Backgrounds (Moving / Still / Plain); Screen shake (off by default); Brightness (Normal / Dim); nothing ever flashes more than 3 times a second |
| Seeing and reading | Text size (3); reading comfort (spacing, then font); high contrast; color-safe palette (color is never the only cue) |
| Time and pace | Timers (Off / Relaxed / Normal); game speed (Slow / Normal / Fast); read-first time on questions |
| Controls | Tap-only play in every game (no required dragging, holding or fast tapping); left-handed layout |
| Language | Menu and read-aloud language (English, Spanish first, more later) |
| Presets | Calm, Low vision, Hearing, Quick start: one tap, still adjustable |

**Who controls it.** Students change their own settings any time, and
settings follow them across all games. Teachers can set class or
per-student defaults (for example an IEP that calls for no timers) and lock
specific settings during an assignment. Class Live: teacher can mute every
student device at once. Share: the teacher device controls the room.
Starts in reduced motion when the iPad's own Reduce Motion is on.

### Equity and cultural responsiveness (built into every game)
- **Avatars that are mirrors:** many skin tones, hair textures, head
  coverings, glasses, hearing aids, wheelchairs and mobility aids,
  non-gendered options, no single "default" kid.
- **Many ways to win:** team play, class goal bars and cooperative modes
  next to competition.
- **Themes that are windows:** places and settings from many communities,
  no cultural costumes or stereotypes, holidays and sacred symbols only by
  teacher choice, community themes in the Theme Builder, reviewed by
  teachers from different communities before release.
- **Language:** multilingual menus and read-aloud; bilingual questions.
- **Money and devices:** every accessibility and equity feature free;
  Share needs no student devices; runs on older iPads and
  Chromebooks; low-bandwidth friendly.
- **Tone:** growth language ("Not yet, try another!"), never a public
  lowest score.

## 4B. Joining, names and teams (Class Live, Share, Versus)

Direct from you (2026-10-24).

### How students get a name (teacher picks one, per game or as a default)
1. **Silly name dice** (the default): student taps a dice and gets a random
   friendly name built from safe word lists, like "Rainbow Unicorn" or
   "Speedy Pickle." Can re-roll a set number of times. No typing, so
   nothing inappropriate is possible, and great for pre-readers.
2. **Type a name:** student types a nickname. Every typed name goes
   through the bad-word filter first, and the teacher can require
   approval before it shows.
3. **Pick from my class list:** teacher's roster (first names or initials),
   student taps their own. Ties reports to real students without accounts.
4. **Teacher assigns names:** teacher types or pastes names ahead of time.

### Restrictions the teacher can apply
- Turn typing off completely (dice or class list only).
- **Approve names before the game starts**: every name waits in the lobby
  until the teacher approves it; teacher can **rename** or **remove** any
  player at any time, including mid-game.
- **Bad words are always blocked**, no setting turns this off: a
  maintained filter (multiple languages, common misspellings and
  letter-swaps, spacing tricks) that blocks before the name ever appears
  on the big screen. Tuned so real names from every culture are not
  wrongly blocked; teacher can override a false block.
- Name length limit, no emojis or symbols option, no duplicate names.
- Lock the room once everyone is in (no late joiners without approval).
- Kicked players cannot rejoin the same game with a new name unless the
  teacher allows it.

### Teams
- **Random teams:** choose the number of teams (or team size) and shuffle.
  Re-shuffle until happy.
- **Teacher assigns teams** (like Zoom breakout rooms): drag or tap each
  student into a team; move students between teams any time, even
  mid-game; save team sets to reuse ("Reading groups," "Table groups").
- **Students choose** (optional, teacher can turn off).
- **Balanced teams** option: spreads students evenly using past results so
  one team isn't stacked.
- Teams get a color **and** an icon and a name (silly-name dice for teams
  too), so K-3 kids find their team without reading.
- Share teams work with no devices: teacher just sets team names and
  who's on each, or plays with "Team 1, Team 2" quick teams.

## 4C. Reports (every game, always)

Direct from you (2026-10-24): every game always produces a report the
teacher can use as real data, modeled on the Independent Work Dashboard's
**Question reports** page (`src/routes/teacher/QuestionReports.tsx` and
the question log in `src/lib/questionLog.ts` in that repo).

### What gets logged (every question, every game, every mode)
For every question shown: date and time, student (or team), game, mode,
question set, question, the right answer, **every answer tapped in order**,
number of tries, right on first try, outcome (right / skipped / left /
time ran out), seconds taken, support level used (read-aloud, hints,
typed-answer support), and which settings were on (e.g. timer off).

### Report views
| View | What it shows |
|---|---|
| **Game session report** (whole group) | Everyone who played that game: each student's questions, right, first-try %, time; class totals; hardest questions; who may need help. Opens automatically when a live game ends. |
| **By student** | One student across every game and day: totals, first-try % over time, every question with every attempt, questions they keep missing |
| **By question** (item analysis) | Each question: how many saw it, % right on first try, most common wrong answer, average time; flags questions most students miss (reteach) or that may be worded unclearly |
| **By question set** | How the class is doing on a set or skill over time |
| **By day** | Every question answered on a day, in order, per student, with totals (same as the Dashboard's "By day") |
| **By game** | Every question asked in a game with every attempt grouped (same as the Dashboard's "By game") |
| **By team** | Team totals and each member's contribution (Share and team Live games) |

### Filters, sorting and exports
- Filter by student (one, several, all), team, game, mode, question set,
  date range, outcome, first try yes/no, assignment.
- Sort any column; search by question text.
- Totals bar on every view (questions, answered right, % first try,
  answers tapped, total time, time per question), same as the Dashboard.
- **Download CSV** and **Print** on every view (both exist in the
  Dashboard); PDF export; later Google Sheets export.
- Shareable student summary for families or IEP meetings (teacher
  chooses what's included).

### Rules
- Reports are teacher-only. Students see their own progress, never other
  students' data or a class ranking unless the teacher shows the podium.
- Reports never cost the student anything: wrong answers are data for the
  teacher, not penalties.
- Data is kept as long as the teacher's plan allows and can be deleted by
  the teacher at any time (privacy rules in section 6.6).

## 5. Free vs paid

### Principles (proposed)
1. **Never paywall anything a student needs to learn or access.**
   Read-aloud, calm mode, reading comfort, text size, high contrast and
   core question types are free, always. (Also a legal and reputational
   protection: districts notice when accessibility is upsold.)
2. **Students never pay, never see ads, never see upgrade prompts.** All
   purchasing happens on teacher pages only.
3. **No real money, loot boxes or random paid rewards anywhere.** In-game
   rewards are earned by answering.
4. **Paywall teacher breadth, customization and insight**: more games,
   themes, reports, bigger live sessions, assignments.

### Draft tiers
| | Free | Pro (teacher) | School / District |
|---|---|---|---|
| Question sets | Unlimited | Unlimited | Shared school library |
| CSV import | Yes | Yes | Yes |
| Games | Starter set (about 1/3 of games) | All games | All games |
| Activity templates | Most | All | All |
| Mode 2 Share (one screen) | Yes | Yes | Yes |
| Mode 3 Solo | Yes | Yes | Yes |
| Mode 4 Versus (shared device, vs CPU) | Yes | Yes | Yes |
| Mode 4 Versus on two devices | No | Yes | Yes |
| Mode 1 Class Live (join code) | Small class cap | Full class | Full class |
| Homework / assignment links | Limited | Unlimited | Unlimited |
| Themes | 3 house themes | Full library + Theme Builder | + school brand theme |
| Reports | **Full report for every game** (all views, filters, CSV, print), kept 30 days | Unlimited history, trends over time, PDF and Sheets export | + school-wide and admin views |
| Name options, approval, rename, bad-word filter, teams | **All** | **All** | **All** |
| Accessibility features | **All** | **All** | **All** |
| Billing | none | Card, monthly or yearly | Invoice / purchase order |
| Privacy paperwork | Standard terms | Standard terms | Signed data privacy agreement |

**Research task (queued):** benchmark current competitor pricing before
setting numbers. School/district plans matter most: a single district
purchase order is worth hundreds of individual card subscriptions, and
districts are who ask for the privacy and accessibility paperwork in
section 6.

### Later ideas worth keeping
- **Classroom economy** (from the Dashboard): class money, a class store.
  Optional Pro add-on, teacher-controlled.
- **Curated content packs**: VLN-written literacy question sets, a
  natural paid add-on that plays to VLN's strength.
- **Daily streak / badges** across games for a continuous student profile.

## 6. Legal readiness checklist (copyright, trademark, privacy, access)

### 6.1 Clean-room rule (already a standing fact, now stricter)
- Rebuild from **ideas and rules only**. Game mechanics are generally not
  protected by copyright, but specific art, sound, code, text and an
  overall "look and feel" can be. So: original visuals, original layout,
  original copy, never "make it look like theirs."
- Never scrape, decompile or copy another platform's code, assets,
  question banks or help text, reachable or not.
- Screenshots of other products may be used as internal reference for
  *what a feature does*, never traced or matched pixel for pixel.

### 6.2 Trademarks
- **No other company's brand name** in any product name, game name, UI
  text, theme name, URL or ad. Internal docs can say "Blooket-style" to
  explain intent; anything a customer sees cannot.
- Rename list in section 3 must be done before launch.
- **Our own name.** "Gamify" is a common word and other companies very
  likely already use it in software (gamify.com and most gamify___.com
  domains are taken, a sign the name is crowded). **A trademark clearance search is the
  first legal task**, before buying domains, printing anything or building
  a logo. Have a backup name list ready.
- Comparison marketing ("works like X, but...") is a lawyer question,
  not a default.

### 6.3 Every asset needs a paper trail
- New file `docs/asset-ledger.md` (to create in Phase 0): every font,
  icon set, image, sound and library, with source and license.
- Current state is clean:
  - Fonts: Baloo 2 and Nunito, SIL Open Font License (commercial use OK)
  - Icons: Phosphor Icons, MIT
  - Libraries: React, React Router, Motion, canvas-confetti, Tailwind,
    Vite: MIT / ISC
  - Sounds: procedural (generated in code), ours
- Allowed sources for new art and sound: made by us, commissioned with a
  written work-for-hire / assignment, CC0, or a commercial license we have
  on file. Not allowed: "found on Google," fan art, anything
  resembling a famous character.
- AI-generated art: usable, but in the US it generally cannot be
  copyrighted by us, so a competitor could reuse it. Never prompt "in the
  style of" a brand or living artist. Hand-finished art is safer for
  signature assets (logo, mascots).
- Add a license check to the build later (fail on GPL/AGPL or unknown
  licenses in production dependencies).

### 6.4 Who owns Gamify (needs an answer early)
- The Dashboard and Gamify code: **who owns it?** You personally, VLN, or
  a school district (if any was built on school time or devices)? Before
  selling, ownership needs to be clear in writing.
- **Who sells it?** VLN (a nonprofit) selling subscriptions raises
  questions about mission fit and unrelated business income; a separate
  company licensing from VLN is another path. Accountant + attorney
  question.
- Contributors (including any student designs from the Junior Designers
  plan) need a simple permission/release before their work ships in a
  paid product. Student work also needs parent permission.

**DECIDE:** who is the seller and owner of record.

### 6.5 Teacher-uploaded content
- Terms of Service: teachers keep ownership of their questions and images
  and give Gamify a license to host and display them.
- Upload rule: "I own this or have permission" confirmation.
- DMCA takedown process and a registered DMCA agent (US Copyright Office,
  low cost, renews every 3 years) so we are protected when a user uploads
  something they should not have.
- Importing from other platforms works only from files the teacher
  exports themselves (CSV). We never connect to or scrape another site.

### 6.6 Student privacy (the deal-breaker for schools)
- **COPPA** (under 13): schools can consent on parents' behalf for
  educational use only. The FTC's updated COPPA rule (2025) tightened
  requirements; confirm current obligations with counsel.
- **FERPA**: we act as a "school official" for the school; student data is
  theirs, used only to provide the service.
- **State student privacy laws** (Vermont has its own student online
  privacy law, as do most states): no selling data, no targeted ads, no
  profiling for non-school purposes, delete on request.
- **District data privacy agreements**: many districts require a signed
  agreement (the Student Data Privacy Consortium's national template is
  common). Be ready to sign one.

Design consequences (cheap now, expensive to retrofit):
- Students join with a code and a first name or nickname. **No student
  email, no student passwords, no student accounts in v1.**
- No third-party trackers, analytics pixels or ads on any student page.
- Store the minimum: name/nickname, class, answers, scores. Teacher can
  delete a class and everything goes.
- Hosting and vendors listed in the privacy policy.

### 6.7 Accessibility as a legal requirement, not just a value
- The US Department of Justice's 2024 ADA Title II rule requires public
  school districts' web content, including third-party tools they use, to
  meet WCAG 2.1 AA, with deadlines starting 2026 to 2027. Districts will
  ask for an accessibility conformance report (VPAT). This is a **selling
  point** for Gamify if we build to it from day one.

### 6.8 Selling
- Payment processor (e.g. Stripe), Terms of Service, Privacy Policy,
  refund policy, school purchase order process.
- Sales tax on digital subscriptions differs by state: accountant
  question (or an automated tax tool).
- Business insurance including cyber liability before storing student data
  at scale.

### Questions to bring to the attorney
1. Trademark clearance for the product name and every game name
2. Code and IP ownership (Dashboard, Gamify, VLN, any district claim)
3. Seller structure (VLN vs separate entity) and nonprofit implications
4. Terms of Service, Privacy Policy, DMCA agent, upload policy
5. COPPA / FERPA / Vermont student privacy compliance, DPA template
6. Comparison marketing against named competitors
7. Contributor and student-design releases

## 7. How the pieces fit (architecture)

```
             Question bank (sets, CSV import, focus star)
                              |
                       Question picker
                              |
        +---------------------+---------------------+
        |                                           |
  "Own game" engine                          "Take turns" engine
  Mode 3 Solo                                Mode 2 Share
  Mode 1 Class Live (+ host screen)          Mode 4 Versus (teams,
        |                                     students, CPU, teacher)
        +---------- Game module contract ----------+
                              |
     Shared question screen + round settings + rewards/report
                              |
                 Theme engine (tokens + skin slots)
                              |
        Teacher account, plans/billing, reports (later phases)
```

**Game module contract** (every game is a plug-in that declares):
- `id`, display name, icon, short description
- play modes supported (1 Class Live / 2 Share / 3 Solo / 4 Versus)
- for Versus: whether it has a CPU player and its difficulty levels
- question types supported
- settings (rounds, questions per break, anything game-specific)
- skin slots it uses from the theme
- plan tier (free / pro)
- how it reports results (one common format)

The shared engine (question screen, picker, rounds, rewards) is described
in `docs/question-engine.md`, carried over from the Dashboard so every
game only decides *when to ask* and *what a right answer does*.

## 8. Roadmap (proposed)

**Phase 0: Clean slate + legal foundation (now)**
- Remove the prototype game (done 2026-10-24)
- Product name trademark search, then buy the domain; ownership decision, attorney booked
- Asset ledger created, rename list confirmed
- Decide first three games and theme scope

**Phase 1: The engine + first three games (free, no accounts)**
- Gear button and full settings panel (section 4A) in every game from day one
- Question log + reports (section 4C), name dice and teams (section 4B)
- Question bank editor + CSV import (CSV import already exists)
- Shared question screen, picker, round settings, results screen
- Theme engine with 3 house themes and skin slots
- Modes 2, 3 and 4 (shared device + CPU): none need a server
- Peg Drop, Team Board, Match Up
- Accessibility core: read-aloud, calm mode, reading comfort, text size
- Three-Lens testing on iPad for each

**Phase 2: Teacher accounts + Pro**
- Teacher sign-in, saved sets in the cloud, homework/assignment links
- Billing and plans, Pro theme library, Theme Builder
- 4 to 6 more games/activities
- Privacy policy, Terms, DMCA agent in place **before** launch

**Phase 3: Live + schools**
- Mode 1 Class Live: join codes, host screen, live leaderboard
- Mode 4 Versus on two devices (same real-time server)
- Reports, per-question logs, export
- School/district plans, purchase orders, DPA signing, VPAT
- Class-designed themes, curated VLN content packs

## 9. Decisions needed from you

1. **Owner and seller**: you, VLN, or a new company? (blocks pricing,
   Terms, payments)
2. **Product name and domain**: you want "Gamify." Open .com domains as of
   2026-10-24 (checked, not bought): joingamify.com, heygamify.com,
   gamifyclassroom.com, gamifymyclass.com, gamifyschool.com,
   gamifyroom.com, gamifyquiz.com, gamifykids.com. Claudia's pick:
   **joingamify.com** (matches the join-a-game moment, reads as the
   brand). Run the trademark search before buying, since the word itself
   is crowded.
3. **First three games**: Claudia's pick is Team board, Match up, and Peg
   Drop or Bubble Pop.
4. **Themes scope**: game stage only, chrome stays branded? (Claudia: yes)
5. **Accounts**: the current rule is "no auth." Selling needs teacher
   accounts in Phase 2. Students stay account-free (code + nickname). OK?
6. **Class Live timing**: Mode 1 needs a real-time server, so it is
   planned for Phase 3. It is also the Blooket-style headline feature.
   Pull it forward to Phase 2 if it matters most for selling?
7. **Report history on Free**: every game always has a full report (your
   rule). Claudia suggests Free keeps 30 days of history and Pro keeps
   everything. OK, or should Free keep everything too?
8. **Free tier generosity**: generous free tier to grow (Claudia's lean),
   or tighter free tier to convert faster?

## 10. Marketing ideas (running list)

Direct from you (2026-10-24): "keep a list going anytime that you know that
something could be used well in marketing." Claudia adds to this list
every time a feature or finding would sell Gamify; add your own any time.
These are raw ideas, not final copy: every line must stay true to what
ships, use no other company's name (section 6.2), and make no research
claim beyond what `docs/gamified-learning-research.md` supports.

| # | Idea / line | Why it sells | Source |
|---|---|---|---|
| 1 | **"The whole class vs the computer."** One team, one goal, every kid cheering together. | Turns competition into class unity; a vivid demo moment | Teacher, 2026-10-24 |
| 2 | **"The whole class vs the teacher."** Can your class beat you? | Kids love beating the teacher; instant buy-in, great in a video | Teacher, 2026-10-24 |
| 3 | **"One question set. Dozens of games. Four ways to play."** | The core promise in one line | Product plan sections 1-2 |
| 4 | **"No devices? No problem."** Share mode runs from one teacher screen. | Works in every classroom, including under-resourced ones | Mode 2 |
| 5 | **Up to 10 teams** on one screen | Bigger than typical team-game limits; fits table groups | Mode 2 |
| 6 | **"Every right answer is a rep."** Built on retrieval practice, one of the best-proven learning techniques. | Research-backed without overclaiming | Research brief 2.2 |
| 7 | **"Wrong answers never cost a thing."** | Low-stress, growth-minded; reassures teachers and parents | Question engine |
| 8 | **"Accessibility is never a paid upgrade."** Every sound level, calm mode, read-aloud and text setting is free. | Values statement and a district buying point (ADA Title II) | Sections 4A, 5, 6.7 |
| 9 | **"A settings button in every game, any time."** Separate sound effects, music and voice levels, calm mode, haptics. | Shows real care for sensory needs; few competitors go this deep | Section 4A |
| 10 | **"Silly name dice: no typing, no bad names."** Plus teacher approval and an always-on bad-word filter. | Solves a classic live-game headache teachers already complain about | Section 4B |
| 11 | **"Teams your way: random, balanced, or hand-picked like breakout rooms."** | Teacher control is a top request | Section 4B |
| 12 | **"Real data, not just a podium."** Every game makes a filterable report by student, question, day and game, with CSV and print. | Turns fun into evidence for grading, IEPs and data meetings | Section 4C |
| 13 | **"Find the question your class keeps missing."** Item analysis shows the most common wrong answer. | Concrete teacher benefit; reteach targeting | Section 4C |
| 14 | **"Themes that change every game at once,"** including your school colors and mascot. | Headline Pro feature; personal and school pride | Section 4 |
| 15 | **"Designed with kids, for kids."** Students co-design themes and features. | Authentic story; ties to the Junior Designers plan | `docs/junior-designers-plan.md` |
| 16 | **"Kids see themselves."** Avatars with every skin tone, hair texture, head covering, glasses, hearing aids and wheelchairs. | Culturally responsive, inclusive; strong with districts and families | Section 4A equity |
| 17 | **"Built by a teacher for students with high support needs, so it works for everyone."** | Founder story and credibility | Origin in the Independent Work Dashboard |
| 18 | **"No student accounts, no ads, no trackers."** | Privacy is the deal-breaker for schools | Section 6.6 |
| 19 | **"Made for iPad first."** | Matches how many classrooms actually run | Standing product fact |
