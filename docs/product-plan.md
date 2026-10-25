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
modes, a theme system with a builder for every game, and accessibility good enough
for students with high support needs.**

## 2. Four play modes (all powered by question sets)

Direct from you (2026-10-24): every game is fueled by question sets and
comes in up to four modes. Every game module declares which modes it
supports. Activity formats (Wordwall / Flippity-style) are not a separate
mode: they are games that plug into these same four modes.

| # | Mode | Who holds a device | Feels like | Needs a server? |
|---|---|---|---|---|
| 1 | **Live** (whole group, own devices) | Every student + teacher host | Classic Blooket hosting | Yes (real-time) |
| 2 | **Share** (whole group, one screen; 1 to 10 teams, or the class vs the CPU or the teacher) | Teacher only, cast or on the board | Baamboozle | No |
| 3 | **Solo** | One student | Dashboard arcade games, homework | No |
| 4 | **Versus** (student vs student, or vs CPU) | One shared device, later two devices | Board-game night | No (shared device); yes (two devices) |

### Mode 1: Live (whole group, independent devices)
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
- **View-only screen for students with visual impairments** (direct from
  you, 2026-10-24): see **Share Mirror** in section 4D. Any Share game can
  be mirrored live to a student's own iPad, view only, so they can see the
  board up close with their own zoom, contrast and read-aloud.

### Mode 3: Solo
- One student, one device: the Dashboard arcade model. Game runs, pauses
  for the question screen, a right answer powers the game.
- Entry points: a homework/assignment link, a classroom center, or free
  play. Assignment lock rules from `docs/question-engine.md` apply.
- Also covers single-player activities (flashcards, match up, sort).

**Two ways into a Solo game** (direct from you, 2026-10-24):
1. **Assignment through the join page:** the teacher assigns a specific
   question set (and a game, or any game); students enter the code at
   `<domain>.com/join` or tap the direct link (details below).
2. **The student's Arcade page** (paid classrooms): the student signs in
   to their own Arcade, picks any game, and gets **randomized questions
   from every question set currently assigned to them**: sets assigned to
   the whole class plus sets assigned to them personally. The focus star
   still works (starred sets first, `docs/question-engine.md`).
   - Students in **free** classrooms see the Arcade with **every game**,
     but games their class doesn't have show a **lock on the cover** and
     can't be tapped (decided 2026-10-24). They play the free games and
     teacher assignments. Students wanting a locked game is meant to start
     the conversation with their teacher.
   - Locked covers show only the lock: no prices, no "upgrade" or "buy"
     words, nothing that asks a child or family to pay. The paying is
     always the teacher's or school's decision.

**Assigning question sets (to the class and/or each student):**
- Assign a set to the **whole class**, to **chosen students**, or both, so
  one student can work on extra or different sets (an IEP goal, an
  intervention group, an extension) while the class works on the shared
  set. Shown as a simple grid: students down the side, sets across the top.
- Each assigned set can have a start and end date, so the Arcade always
  draws from what the student is working on now.
- **Free:** **one** assigned set at a time per student. **Plus:** up to
  5 at a time per student. **Pro:** unlimited. (Decided 2026-10-24.)
- Changing an assignment changes the Arcade's question mix immediately;
  reports show which set each question came from.

**Assigned Solo games** (direct from you, 2026-10-24):
1. Teacher picks a question set and a game (or "any game"), sets the
   assignment options (target questions, rounds, due date, which settings
   are locked) and assigns it to a class or group.
2. Gamify makes an **assignment code** (a player code, section 4D) and a
   **direct link** with the code built in (`<domain>.com/join/K7P2QX`).
   Tapping the link drops the student straight into the game.
3. Ways to hand it out:
   - **Share to Google Classroom** button (posts the link as an
     assignment or announcement), or copy the link anywhere (email, LMS,
     class website).
   - **Code screen** for the smart board / Promethean: one tap casts a
     clean, simple screen with only the big code, the QR code and the
     `/join` address. Nothing else, no student data.
   - Students go to `<domain>.com/join` and type the code.
4. Students pick their name from the class list (or the name option the
   teacher chose, section 4B), so every answer lands in the right
   student's report.
5. While students play, the teacher has the **Live monitor** (section 4E)
   on their own device, never on the projector, and the **Lock** button
   for any student.

### Mode 4: Versus (student vs student, or student vs CPU)
- **Pass-and-play first:** two players (up to four for some games) on one
  iPad, taking turns. Each turn starts with that player's question.
- **Vs CPU:** a computer player with three levels (Easy, Medium, Hard)
  that plays the game moves; it never answers questions, the student
  always does. CPU is a friendly character, never gloats or teases.
- **Two devices later:** student vs student on separate iPads with a short
  match code, using the same real-time server as Live.
- Kindness rules: both players earn for every right answer whoever wins,
  the loser screen says "Good game! Rematch?", and a handicap option lets
  the teacher give one player a head start or extra support.

### The big build insight: two engines, not four
- **"Everyone plays their own game" engine** powers Solo (3) and Class
  Live (1). Live is Solo plus a host screen that collects scores.
  So every Solo game we build becomes a Live game almost for free.
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
| Match Three (match-3) | Fine, but must not resemble any famous match-3 look | Match Three | 1 3 |
| Bubble Shooter | Generic term, fine | Bubble Pop | 1 3 |
| Castle Defense | Generic, fine | Castle Guard | 1 3 |
| Bowling | Generic, fine | Bowling | 1 2 3 4 |
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

## 4. Themes for every game (headline paid feature)

### What a theme is
**Themes are designed per game** (direct from you, 2026-10-24): each
theme belongs to one game and is built on that game's own template. A Peg
Drop theme skins Peg Drop; it is not shared across games. A theme is a
data pack, not code, made of:

- **Palette tokens** (background, surface, accent, text, success, miss),
  validated for contrast automatically
- **Font pair** (from an approved, licensed list only)
- **Backdrop** (stage background art or pattern)
- **The game's own pieces**: each game declares its own list of
  designable pieces (Peg Drop: background, board, balls, pegs, buckets,
  power-ups, cover; Team Board: background, card backs, reveal cards,
  team tokens...). The game's **theme template** is built from that list.
- **Sound pack** (right, miss, win, tap), procedural or licensed
- **Celebration style** (confetti, stars, bubbles, fireworks), always with
  a calm-mode version

Example: an "Ocean" Peg Drop theme makes the ball a pearl, the pegs
coral and the buckets clam shells. An Ocean look for Bubble Pop is its own
theme, designed on Bubble Pop's template. The theme picker inside each
game shows only that game's themes.

### Theme tiers (matches section 5)
- **Free:** the house default theme to play; every other theme can be
  **previewed but not played**; no Theme Builder.
- **Plus:** full theme library, playable, plus seasonal drops (fall,
  winter, spring, field day; secular by default, specific holidays only
  when a teacher chooses them).
- **Pro:** everything in Plus **and the Theme Builder**.

### The Theme Builder (Pro): designing themes is a game in itself
Direct from you (2026-10-24): designing themes should be a fun, engaging
feature that drives engagement and marketing, done digitally **or by hand
with pencils, markers and paint**, modeled on the Plinko theme builder you
built in the Independent Work Dashboard
(`src/routes/teacher/PlinkoThemeBuilder.tsx` and `src/lib/plinkoThemes.ts`
in that repo), which was super intuitive.

**What carries over from the Dashboard builder:**
- **Live preview on top**: the real game view updates as you design, with
  tabs for each screen (start, game board, question, winner).
- **A row of upload cards**, one per piece of the theme (background, board,
  player piece, goals, cards, buttons, cover), each showing a green check
  once filled. Drop a picture on a card or tap to upload; tap a filled
  card to see it big.
- **Printable template pages**: download a page for any card, students
  draw and color it by hand, then **scan it with the iPad camera** (or
  upload a photo or PDF page) and the builder cuts out each piece
  automatically.
- **Color palette** with color pickers and hex codes, each color labeled
  with where it shows up (primary buttons, text, board, panels...).
- **Fonts** for title, headers and body text (from the approved licensed
  list, section 6.3).
- **Sounds** per game element (pick from the sound library or upload),
  with a Play button to hear each one.
- **Anything left empty keeps the default look**, so a theme can be as
  small as "new background and our class colors."
- **Cover picture** (1:1) for the theme's card in the theme picker.

**What's new in Gamify:**
- **A builder and a template for every game.** Each game has its own
  Theme Builder page (like the Dashboard's Plinko builder) and its own
  downloadable theme template showing every piece to design, with sizes.
  How a class designs a theme:
  1. Download the theme template for the game you want.
  2. Draw, paint or color on the printed template, or design digitally
     on it.
  3. Upload everything to that game's Theme Builder (scan the pages or
     upload the files); the builder cuts out each piece.
- **Student design mode.** The teacher can open a design project: students
  (in groups or alone) design pieces on their own devices or on paper,
  submit them, and the teacher picks and approves what goes into the
  class theme. Nothing reaches students until the teacher approves it
  (same approval step as the Dashboard builder).
- **Kid-friendly builder screens:** big tiles, icons, read-aloud on every
  step, a drawing canvas with brushes, stamps and fill for students who
  design digitally, and a "make it ours" wizard (pick colors, draw a
  mascot, pick a sound, done) for younger classes.
- **Built-in safety checks:** contrast checker on colors (refuses ones
  that fail), calm-mode version made automatically (motion and
  celebration toned down), no flashing, upload rights check box, teacher
  review before publishing.
- **Share themes:** keep it in the class, share with your school, or
  submit it to the public theme gallery (reviewed before it's listed).
  Student art in public themes needs the release in section 6.4.
- **Design credits:** the theme's cover shows "Designed by Room 12" (first
  names or class name only, teacher's choice), so students see their work
  credited every time it's played.

**Why it drives engagement:** students who designed the theme are invested
in playing it; it gives art, writing (naming and describing the theme) and
design-thinking a real audience (`docs/junior-designers-plan.md`); and a
new class theme makes a familiar game feel new again, which fights the
novelty drop-off in `docs/gamified-learning-research.md` 3.4.

### Any age, one platform (direct from you, 2026-10-24)
Themes and question sets let Gamify fit early childhood through college:
a grown-up theme and an algebra or statistics set for high school and
college, a playful theme and phonics set for kindergarten, same games
underneath. The starter library spans K-1 to college. Anything people
make or sell on Gamify must be original or licensed (section 6).

### House themes stay simple (direct from you, 2026-10-24)
The free/default look is deliberately plain: flat colors, one simple
pattern, clean shapes, built from code with no purchased illustration.
That makes the library feel like an upgrade and makes designing your own
(and using community themes) the exciting part. Bought art goes to
avatar items, a few game pieces and library accents. Details:
`docs/development-plan.md` Part 2.

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

## 4F. XP, shop and Pals: removed (2026-10-24)

Direct from you: "delete xp/shop/pals in general from the game. not doing
that right now." No XP, shop, Pals or collectibles anywhere. If it comes
back later, the earlier design (cosmetic only, invisible in free classes,
never sold to students) is in this file's git history.

## 4A. Settings on every game, on every device (accessibility, free)

Direct from you (2026-10-24): every game has comprehensive settings, usable
from every device, reachable at any point in the game. Research behind
every item: `docs/settings-equity-research.md`.

**The gear button.** One gear, same corner, same look in every game and
every theme. Tapping it pauses the game (solo and versus; in Live it
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
specific settings during an assignment. Live: teacher can mute every
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

## 4B. Joining, names and teams (Live, Share, Versus)

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

### Play mode switches (all plans, direct from you, 2026-10-24)
Teachers choose which of the four play modes students see: one, a few or
all, per classroom and optionally per student (a student's setting can only
narrow the class's). Some teachers need to offer only Solo, or one mode at
a time. Hidden modes don't appear anywhere on the student side.

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

## 4D. One join page and Share Mirror

Direct from you (2026-10-24).

### One join page for everything: `<domain>.com/join`
Every way into a game goes through the same page, no matter the game or
mode: **`<domain>.com/join`** (for example `joingamify.com/join` if that
domain is chosen). The student types the code the teacher shows, or scans
the QR code, which opens `/join` with the code already filled in. The page
reads the code and sends the student to the right place.

| Code type | Format | Example | What it opens |
|---|---|---|---|
| **Player code** | Letters **and** numbers, 6 characters | `K7P2QX` | Joins as a player: Live, Versus on two devices, assignment links |
| **Viewer code** | Letters **only**, 6 characters | `BRTKMS` | Joins **view only**: Share Mirror (and later any view-only screen) |

Code rules:
- Leaves out look-alike characters (0/O, 1/I/L, 5/S) so a K-3 student or a
  student with low vision can't mix them up.
- Generated codes leave out vowels, so a code can never spell a word
  (including a bad one).
- Big, high-contrast code on the teacher screen, read-aloud button for the
  code, and a QR code next to it.
- The `/join` page uses large letter tiles, accepts lower or upper case,
  and tells the student in words and an icon whether they're joining to
  **play** or to **watch**.
- Codes stop working when the game ends; the teacher can make a fresh code
  any time.

### Share Mirror (view-only screen)
For a student who is visually impaired (or anyone who can't see the board
well), the teacher turns on a second, view-only copy of the Share screen
on the student's own device.

- **Where:** a setting in every game that has Share mode: gear button ->
  **Connect another device**. Shows a viewer code (letters only) and QR.
- **What the student sees:** the live Share board, updating as the game
  moves: the question, answers, whose turn, the board, scores.
- **View only:** nothing on the mirror can change the game. No answering,
  no tapping turns.
- **Their own settings on their own device:** zoom and pinch, larger text,
  high contrast, color-safe palette, calm mode, and **read-aloud through
  their own headphones** (question, answers and whose turn), plus support
  for the iPad's own Zoom and VoiceOver: every board state is also
  described in text so a screen reader can announce it ("Team Rocket's
  turn. Question: ... Team Rocket drops the ball: 40 points").
- **Teacher control:** see every connected viewer, name them, remove
  them, or end all mirrors. Viewer codes are separate from player codes so
  a viewer can never join as a player by mistake.
- **More than one viewer** allowed (for example two students with low
  vision, or a paraprofessional's device).
- **Also useful for:** a student who needs to sit away from the group, a
  co-teacher across the room, a student with an IEP accommodation for
  copies of displayed material.
- **Tech note:** the mirror needs the same real-time server as Live,
  so Share Mirror ships with that server (see roadmap). Share itself
  still works with no server.

## 4E. Teacher live monitor and the Lock button (every own-device mode)

Direct from you (2026-10-24), flagged as a must-get-right feature. Applies
to **every** way students play on their own devices: assigned Solo, Class
Live, Versus on two devices, and Share Mirror viewers.

### Two teacher screens, kept apart
- **Code screen** (for the projector): the code, QR and `/join` address
  only. Safe to cast.
- **Live monitor** (teacher's device only): never shows on the code
  screen. If the teacher's device is mirroring, Gamify warns before
  opening the monitor ("You're casting. Open the monitor anyway?").

### What the live monitor shows (updates as it happens)
- One tile per student: name, **status** (playing, on a question, idle,
  left the game, locked, finished), current question, **time on this
  question** (tile turns amber, then orange, past teacher-set limits),
  questions answered, right on first try, progress to the assignment
  target.
- **Alerts:** stuck on a question too long, guessing check triggered
  (rapid wrong taps), left the game / switched apps, rejoined, finished.
- Tap a student: their question-by-question feed as it happens (question,
  every answer tapped in order, time taken), same columns as the reports
  (section 4C).
- Sort and filter tiles (needs help first, slowest, not started,
  finished), and a class summary bar.
- Everything shown live is saved to the reports automatically.

### The Lock button
**What it does to the student's device:**
- **Stops everything at once:** gameplay, the current question, timers,
  sound. Nothing counts against the student; timers resume where they
  stopped.
- **Freezes the screen completely:** a full-screen lock covers the game;
  nothing can be tapped, no menus, no gear button, no navigation, no
  back, no join page. Only the teacher can release it.
- **Shows the teacher's message**, large and read aloud if read-aloud is
  on. Default: **"Your teacher has paused your game. Please go see your
  teacher."**
- The lock screen is calm (no red, no alarm sound) so it redirects
  without shaming.

**Teacher controls when locking:**
- Lock **one student**, **several**, or **everyone** ("Eyes up front"
  for the whole class).
- Type a **custom message** before locking, private to that student only
  (it never appears on the projector or on other students' screens).
  Use it to discreetly check in ("Are you OK? Come see me when you're
  ready") or to redirect ("Please use your real name and rejoin").
- Quick-pick message templates the teacher can edit and save ("Please see
  me," "Take a break and come back," "Eyes up front," "Great focus, keep
  going," etc.).
- **Unlock** one or all; option to send a short message on unlock too
  ("Thanks, you can keep playing").
- Optional: lock automatically when a student leaves and comes back too
  many times, or when the guessing check fires repeatedly.

**Making the lock stick (inside Gamify):**
- The lock is saved on the server and on the device: reloading the page,
  closing and reopening the tab, or going back to `/join` brings the
  student straight back to the lock screen.
- A locked student cannot rejoin the same game with a new name or code;
  the teacher sees any attempt as an alert.
- If the internet drops, the lock stays on and the game stays stopped
  until the device reconnects and the teacher unlocks.

**The honest limit, and how schools close it:** a website cannot lock the
whole iPad. A student can still press the Home button and open another
app. Gamify handles what it can (the game stays frozen, the teacher sees
"left the game" instantly, and the student returns to the lock). For
complete device lockdown, schools use the tools built for that: Apple's
Guided Access on a single iPad, or Apple Classroom / the school's device
management, which can lock managed iPads to one app or lock the screen.
Gamify's teacher guide should explain how to pair them. A future installed
Gamify app could go further on managed devices.

**Reports:** every lock is logged (time, student, message sent, how long)
in the teacher's reports and student report, so it can be used in
behavior documentation if needed. The student's game data is never
deleted by a lock.

## 4G. Owner dashboard (yours only)

Direct from you (2026-10-24): Gamify has four sides: teacher, student, the
public website, and a private **owner dashboard** for you, kept separate
from Vermont Literacy Network. It's a widget desktop (drag, reorder,
collapse, expand) showing active subscriptions, projected income for set
periods, Stripe charts and CSVs for your bookkeeper, growth suggestions,
teacher reports, and a support inbox where you answer help and chat
requests. Build checklist: development plan Stage 7B.

## 5. Free vs paid

### Principles (proposed)
1. **Never paywall anything a student needs to learn or access.**
   Read-aloud, calm mode, reading comfort, text size, high contrast and
   core question types are free, always. (Also a legal and reputational
   protection: districts notice when accessibility is upsold.)
2. **Students never pay, never see ads, and never see upgrade prompts,
   prices or "buy" messages.** All purchasing happens on teacher pages
   only. The one deliberate exception (your decision, 2026-10-24): free
   students see locked game covers in the Arcade, as a quiet lock icon
   only, so wanting a game becomes a conversation with the teacher.
   (Background: the
   2021 FTC complaint against a kids' math game, see
   `docs/competitor-plans-research.md` section 3.)
3. **No real money, loot boxes or random paid rewards anywhere.** In-game
   rewards are earned by playing and answering, never bought.
4. **Paywall teacher breadth, customization and insight**: more games,
   themes, reports, bigger live sessions, assignments.

### Tiers (your decisions, 2026-10-24; prices proposed)
Competitor cross-comparison and the reasoning behind each line:
`docs/competitor-plans-research.md`. Tier names are working names.

| | Free | Plus (mid tier) | Pro (top tier) | School / District |
|---|---|---|---|---|
| Teacher account (log in, saves your work) | Yes | Yes | Yes | Yes |
| Classrooms | **1** | **3** | **Unlimited** | Unlimited, school-wide |
| Students per classroom | **Up to 30** (decided 2026-10-24) | 60 | Unlimited | Unlimited |
| Own question sets saved | **3** | Unlimited | Unlimited | Unlimited + shared school library |
| Public question sets (published by others) | Use any | Use any, publish your own | Use any, publish your own | Same |
| CSV import | Yes (counts toward the 3) | Yes | Yes | Yes |
| Games | **Free games only** (a set list) | All games | All games | All games |
| Modes in the games you can use | All four (Live up to your 30 students) | All four | All four | All four |
| Themes | Classic only; others preview only; try the Theme Builder on one game (developer's pick) | Full theme library + one Theme Builder design per game | Full library + unlimited Theme Builder designs | + school brand theme |
| **Live monitor + Lock button** (4E) | **No** | Yes | Yes | Yes |
| Assignments (code, link, Google Classroom) | Yes, free games only | Yes | Yes | Yes + LMS sync later |
| Question sets assigned at a time, per student (class and/or individual) | **1** | **5** | Unlimited | Unlimited |
| **Student Arcade page** (play any game, questions from all assigned sets) | Free games playable; **paid games shown locked** (lock on cover, can't tap) | Yes | Yes | Yes |
| Versus on two devices | No | Yes | Yes | Yes |
| Reports | Report for every game played (all views, CSV, print), 30 days of history | Full history | Full history, trends, PDF/Sheets export | + school and admin views |
| Names, approval, rename, remove player, bad-word filter, teams | **All** | All | All | All |
| Choose which play modes students see | **Yes** | Yes | Yes | Yes |
| Accessibility settings (4A) and Share Mirror (4D) | **All, free** | All | All | All |
| Price (set by you, 2026-10-24) | $0 | About $8/mo billed yearly ($96/yr) | About $15/mo billed yearly ($180/yr) | Per-teacher Pro seats: 5-9 $162, 10-24 $144, 25+ $126 each; districts quoted; POs yearly, prepaid, net 30, 5-seat minimum |
| Privacy paperwork | Standard terms | Standard terms | Standard terms | Signed data privacy agreement |

Notes:
- Removing or renaming a player and the bad-word filter stay free, so a
  free teacher can still handle an inappropriate name without the Lock
  button.
- In free classrooms themes are not shown to students.
  Paid games appear in the Arcade with a lock on the cover and can't be
  tapped (principle 2's one exception). Teachers see previews and upgrade
  options on their own pages.

**School/district plans matter most:** a single district purchase order is
worth hundreds of individual card subscriptions, and districts are who ask
for the privacy and accessibility paperwork in section 6.

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
- **Logo (2026-10-24):** you designed the Gamify logo (a "G" whose
  top is an arcade joystick, plus the "Gamify" wordmark) in Canva; it is in
  the app header and browser/iPad icons, logged in `docs/asset-ledger.md`.
  Before trademarking it, confirm the Canva elements and font used allow
  use in a logo/trademark (Canva limits trademarking some stock
  elements); a designer can redraw it as fully original vector art if
  needed. Include the logo in the trademark search.
- **Our own name.** "Gamify" is a common word and other companies very
  likely already use it in software (gamify.com and most gamify___.com
  domains are taken, a sign the name is crowded). **A trademark clearance search is the
  first legal task**, before buying domains, printing anything or building
  a logo. Have a backup name list ready.
- Comparison marketing ("works like X, but...") is a lawyer question,
  not a default.
- Integrations (Share to Google Classroom, Apple Classroom in the teacher
  guide) may name those products to describe compatibility, following
  each company's published branding rules (their official button, no
  implied endorsement).

### 6.3 Every asset needs a paper trail
- New file `docs/asset-ledger.md` (to create in Phase 0): every font,
  icon set, image, sound and library, with source and license.
- Current state is clean:
  - Fonts: Grow Year (headings, the logo lettering; free for commercial use) and Inclusive Sans (body, designed for readability and inclusion), SIL Open Font License (commercial use OK)
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
  Mode 1 Live (+ host screen)          Mode 4 Versus (teams,
        |                                     students, CPU, teacher)
        +---------- Game module contract ----------+
                              |
     Shared question screen + round settings + rewards/report
                              |
                 Theme engine (tokens + each game's own pieces)
                              |
        Teacher account, plans/billing, reports (later phases)
```

**Game module contract** (every game is a plug-in that declares):
- `id`, display name, icon, short description
- play modes supported (1 Live / 2 Share / 3 Solo / 4 Versus)
- for Versus: whether it has a CPU player and its difficulty levels
- question types supported
- settings (rounds, questions per break, anything game-specific)
- its designable pieces and theme template (themes are per game)
- plan tier (free / pro)
- how it reports results (one common format)

The shared engine (question screen, picker, rounds, rewards) is described
in `docs/question-engine.md`, carried over from the Dashboard so every
game only decides *when to ask* and *what a right answer does*.

## 8. Roadmap (proposed)

> Superseded in detail by `docs/development-plan.md` (stages 0-9, written
> 2026-10-24). The phases below are the original outline.

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
- Theme engine with simple house themes for each game
- Modes 2, 3 and 4 (shared device + CPU): none need a server
- Peg Drop, Team Board, Match Up
- Accessibility core: read-aloud, calm mode, reading comfort, text size
- Three-Lens testing on iPad for each

**Phase 2: Teacher accounts + Plus/Pro**
- Classrooms and class lists, tier limits (classrooms, students, 3 saved
  sets), public question set library
- Teacher sign-in, saved sets in the cloud, assignments with code, direct
  link and Share to Google Classroom
- Billing and plans, Pro theme library, Theme Builder
- 4 to 6 more games/activities
- Privacy policy, Terms, DMCA agent in place **before** launch

**Phase 3: Live + schools**
- The `/join` page and code system (player and viewer codes)
- Mode 1 Live: join codes, host screen, live leaderboard
- Share Mirror (view-only screen), first feature on the real-time server
- Live monitor and Lock button for every own-device mode (also needs the
  real-time server; strong case for Phase 2, see decision 8)
- Mode 4 Versus on two devices (same real-time server)
- Reports, per-question logs, export
- School/district plans, purchase orders, DPA signing, VPAT
- Class-designed themes, curated VLN content packs

## 9. Decisions needed from you

1. ~~Owner and seller~~ DECIDED 2026-10-24: **you, personally.** You'll
   buy the domain soon.
2. **Product name and domain**: you want "Gamify." Open .com domains as of
   2026-10-24 (checked, not bought): joingamify.com, heygamify.com,
   gamifyclassroom.com, gamifymyclass.com, gamifyschool.com,
   gamifyroom.com, gamifyquiz.com, gamifykids.com. Claudia's pick:
   **joingamify.com** (matches the join-a-game moment, reads as the
   brand). Run the trademark search before buying, since the word itself
   is crowded.
3. ~~First three games~~ DECIDED 2026-10-24: **Game Show** (Share; surprise
   cards and a category grid), **Match Three** (Solo match-3), **Four in a
   Row** (Versus).
4. **Themes scope**: game stage only, chrome stays branded? (Claudia: yes)
5. **Accounts**: teachers log in (all tiers, so free users can save their
   3 sets and 1 classroom). Students have no email accounts: they are
   entries on the teacher's class list (needed for reports over time) and join
   by code. OK?
6. **Live timing**: Mode 1 needs a real-time server, so it is
   planned for Phase 3. It is also the Blooket-style headline feature.
   Pull it forward to Phase 2 if it matters most for selling?
7. **Report history on Free**: every game always has a full report (your
   rule). Claudia suggests Free keeps 30 days of history and paid keeps
   everything. OK, or should Free keep everything too?
8. **Real-time server timing**: Live, Versus on two devices, Share
   Mirror and the live monitor + Lock button all need it. Share Mirror is an accessibility feature,
   which is a reason to bring the server forward to Phase 2.
9. **Free tier limits** (your tiers are set; three numbers to confirm):
   - ~~Free classroom size~~ DECIDED 2026-10-24: **30 students**.
   - ~~Prices~~ SET 2026-10-24: $96/yr Plus, $180/yr Pro (students per
     classroom: Plus 60, Pro unlimited), above the market's ~$60 anchor (`docs/competitor-plans-research.md`).
10. **Which games are free**: a set list of free games. Claudia's
    suggestion: at least one game in every mode (for example Team Board,
    Match Up, Peg Drop, Four in a Row) so free teachers try all four ways
    to play, with the rest on Plus and Pro.
11. ~~Free students' Arcade~~ DECIDED 2026-10-24: every game shown;
    games the class doesn't have get a lock on the cover and can't be
    tapped. Kept kid-safe: lock icon only, no prices or "buy" words.
12. ~~Plus limit for assigned sets per student~~ DECIDED 2026-10-24: 5.

## 11. Not yet considered: pre-build checklist (2026-10-24)

Your question: "what hasn't been considered that needs to be before we
start to build?" Claudia's gap review of everything above.

### A. Decide before writing code (these shape the foundation)
1. **Content model for every game type.** Question sets today are
   multiple choice (plus the Dashboard's typed types). Activity games need
   other shapes: word search and crossword need word + clue lists, Match Up
   and Memory need pairs, Group Sort needs categories, Category Board needs
   categories with point values, labelled diagrams need an image with
   pins. One question set must hold these (or convert between them, e.g.
   a multiple-choice question becomes a match pair) or "one set, every
   game" breaks. Also images, audio, math notation and alt text.
2. **How a student proves who they are** on a shared iPad without an
   account. Reports, the Lock and now the **student Arcade sign-in**
   all depend on it. Picking your name
   from a list lets a student pick a classmate's name. Options: a picture
   password per student, a printed QR login badge, or a short personal
   code. K-1 friendly and quick.
3. **Tech stack and backend.**
   - Database, teacher sign-in, file storage, real-time server for live
     games, and hosting: choose and price them. The Dashboard runs on
     Supabase; Gamify needs its own separate instance or another service
     (the no-dependency rule in `CLAUDE.md`).
   - **TypeScript:** Gamify is plain JavaScript while the Dashboard code it
     reuses is TypeScript. Switch Gamify to TypeScript before building so
     the Dashboard logic ports cleanly and bugs are caught earlier.
4. **Cost per teacher.** Hosting, live servers, storage for uploaded art,
   and especially **human-voice read-aloud** (the Dashboard uses a paid
   voice service) cost money per use. At $96/yr per Plus teacher, and many
   free teachers costing money too, the numbers need checking now. Free
   tier read-aloud may need the device voice instead.
5. **Smallest sellable version (MVP) and a target date.** Back-to-school
   (August) is when teachers try new tools. Work backward: which games,
   modes and tiers must exist on day one, and what waits.
6. **Who builds the art and sound.** 20+ games, house themes and
   avatar items need a lot of original art. Decide: commissioned artists
   (with work-for-hire contracts), a style guide so everything looks like
   one product, and a budget. Background music needs licensed tracks.
7. **Owner, seller and name** (decisions 1 and 2) still block Terms,
   payments, domain and logo.

### B. School realities that can sink adoption
8. **School web filters.** District filters (GoGuardian, Securly and
   similar) often block anything categorized as "games." A new domain can
   be blocked on day one. Plan: get the domain categorized as education,
   publish an "IT whitelist" page (domains, ports, real-time connections),
   and test live games on a filtered school network.
9. **Device and browser matrix.** iPad is first, but many US schools run
   Chromebooks, and smart boards use their own browsers. Decide the
   supported list, the oldest iPad and iOS supported, and a performance
   budget so games run smoothly on old devices.
10. **Weak or dropped internet.** What happens when Wi-Fi drops mid-game,
    a student refreshes, or the teacher's laptop sleeps during Live.
11. **Rostering.** Google Classroom roster import for teachers; Clever /
    ClassLink for districts (most district deals require one).
12. **Co-teachers, paraprofessionals and substitutes.** Shared access to a
    classroom, a sub mode with limited controls, para access to the live
    monitor.

### C. Safety and trust
13. **No chat, anywhere.** Make it a written rule: students can't message
    each other or anyone else. Removes a whole category of child-safety
    risk.
14. **Moderation of public content.** Public question sets and the public
    theme gallery need review before listing, a "report this" button, and
    someone responsible for checking reports.
15. **Strangers joining live games.** Codes can leak to social media.
    Needs rate limits on code guessing, code expiry, room lock (4B), and
    teacher approval.
16. **Security basics.** Encrypted data, backups, a breach response plan,
    and a security review before launch. Districts will send security
    questionnaires.

### D. Business details
17. **Downgrades and trials.** What happens when a Pro teacher drops to
    Free with 5 classrooms and 40 sets: Claudia suggests nothing is
    deleted; extras become read-only until they upgrade or choose which to
    keep. Free trial length for Plus/Pro.
18. **Support.** A help center, how teachers contact you, who answers,
    and a status page when something is down.
19. **Product analytics without tracking kids.** Teacher-side usage
    numbers (which games get played) to guide building, with nothing on
    student pages (section 6.6).
20. **Gamify vs the Dashboard.** Does the Dashboard keep its games? Is
    code shared between them, and who owns the shared parts (ties to
    6.4)?

### E. Quality
21. **Automated tests and checks.** The repo has none yet. Set up
    automated tests, a check that runs on every change, and the Three-Lens
    browser testing from `docs/testing-standards.md` before game code
    piles up.
22. **Language-ready from day one.** Spanish is promised, so all text has
    to be built for translation from the start; retrofitting is painful.
23. **Accessibility audit** against WCAG 2.1 AA and a VPAT before selling
    to districts (6.7).
24. **Pilot teachers.** Line up a few classrooms to test early builds and
    to supply the outcome data in `docs/gamified-learning-research.md`
    section 5.

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
| 14 | **"Make any game your own,"** including your school colors and mascot. | Headline Pro feature; personal and school pride | Section 4 |
| 15 | **"Designed with kids, for kids."** Students co-design themes and features. | Authentic story; ties to the Junior Designers plan | `docs/junior-designers-plan.md` |
| 16 | **"Kids see themselves."** Avatars with every skin tone, hair texture, head covering, glasses, hearing aids and wheelchairs. | Culturally responsive, inclusive; strong with districts and families | Section 4A equity |
| 17 | **"Built by a teacher for students with high support needs, so it works for everyone."** | Founder story and credibility | Origin in the Independent Work Dashboard |
| 18 | **"No student accounts, no ads, no trackers."** | Privacy is the deal-breaker for schools | Section 6.6 |
| 19 | **"Made for iPad first."** | Matches how many classrooms actually run | Standing product fact |
| 20 | **"Every student sees the board."** Share Mirror puts the live game on a visually impaired student's own iPad, view only, with their own zoom and read-aloud. | Real accessibility story; an IEP accommodation built in, free | Teacher, 2026-10-24; section 4D |
| 21 | **"One link for everything: <domain>.com/join."** | Simple for kids and families; easy to put on a classroom poster | Teacher, 2026-10-24; section 4D |
| 22 | **"Codes that can't spell bad words."** | Small detail that shows care; teachers notice | Section 4D |
| 23 | **"Freeze any screen with one tap, and send a private message."** The Lock button stops the game and shows only that student your note. | Classroom management teachers ask for; discreet, not shaming | Teacher, 2026-10-24; section 4E |
| 24 | **"Watch every answer as it happens."** Live monitor shows who's stuck, who's guessing and how long each question takes. | Real-time formative assessment | Teacher, 2026-10-24; section 4E |
| 25 | **"Assign in seconds: link, code, or Google Classroom."** | Fits how teachers already hand out work | Teacher, 2026-10-24; Mode 3 |
| 26 | **"Projector-safe."** The code screen shows only the code; student data stays on your device. | Privacy in front of the class | Section 4E |
| 27 | ~~"Collect Pals with every right answer."~~ (removed with XP, 2026-10-24) | The student-pull feature that gets kids asking their teacher to play | Teacher, 2026-10-24; section 4F |
| 28 | **"We never advertise to your students."** No upgrade prompts, no locked items, no ads, ever, on any plan. | Trust with teachers, parents and districts; a contrast with criticized competitors (without naming them) | Section 5 principle 2 |
| 29 | ~~"Looks, not advantages."~~ (removed with XP, 2026-10-24) | Fairness parents and teachers care about | Section 4F |
| 30 | **"Free forever: one classroom, every accessibility feature, and up to 10 teams on one screen."** | A generous, honest free tier headline | Section 5 |
| 31 | **"Your class designs the game."** Download the game's template, draw it with markers and paint, scan it with an iPad, and play it. | Hero feature for marketing: a photo of kids painting next to the same art in the game sells itself | Teacher, 2026-10-24; section 4 Theme Builder |
| 32 | **"Designed by Room 12."** Every class-made theme carries its designers' credit. | Pride and ownership; shareable moments for families and school social media | Section 4 Theme Builder |
| 33 | **"A theme template for every game."** Print it, design it, scan it, play it. | Simple four-step promise that shows how easy designing is | Section 4 |
| 34 | **Photo and video idea:** students painting a template page, scanning it, and seeing their art drop onto the board seconds later. | The demo video for the website and conferences (with signed photo releases) | Teacher, 2026-10-24 |
| 35 | **"Every student gets their own Arcade, filled with exactly what they're working on."** Assign sets to the class or to one student, and every game draws from them. | Differentiation teachers can feel; strong for IEPs and intervention groups | Teacher, 2026-10-24; Mode 3 |
| 36 | **"Start simple. Make it yours."** Gamify's look is clean on purpose, so your class's own theme is the star. | Frames simple house themes as an invitation to design; drives Theme Builder and gallery use | Teacher, 2026-10-24 |
| 37 | **"From kindergarten to college."** One platform, any age: themes and question sets make every game fit the class in front of you. | Widens the market to middle school, high school, college and tutoring | Teacher, 2026-10-24 |
| 38 | **"Tell Gamify" button in every game and page:** teachers and students report bugs, glitches, problems and ideas straight to the developer. | Shows a responsive, listening company; builds loyalty | Teacher, 2026-10-24 |
| 39 | **"You asked, we built it" social series:** whenever a report leads to a change, post a short TikTok or Instagram video: the report (no student names or identifying details), the fix in action, a thank-you. Get the teacher's okay before quoting their words. | Constant, authentic content; proves the product improves weekly; invites more feedback | Teacher, 2026-10-24 |
| 40 | **Vermont Literacy Network beta code:** your VLN email list gets a code for 3 months of Plus free in exchange for explicit feedback, a few surveys and student feedback. | Warm first users, real feedback, testimonials and early classroom photos for launch | Teacher, 2026-10-24 |
| 41 | **Founding beta teachers:** a hand-picked group with free access who shape Gamify ("Founding Teacher" badge on their profile, credit on the website with permission). | Credibility and word of mouth; quotes for the website and social posts | Teacher, 2026-10-24 |
| 42 | **"Our students help build Gamify."** Beta classes learn the Tell Gamify button in a short lesson, and their reports shape the games. | Authentic story for social posts and the beta launch | Teacher, 2026-10-24 |
| 43 | **Landing line: "Every move is a practice question."** Supporting line: "Research across 222 classroom studies found that answering practice questions helps students remember more, from elementary school to college. Gamify turns each one into a game move." | The core "why it works" for principals; true of every game | Beth, 2026-10-24; research brief F2 (Yang et al., 2021) |
| 44 | **Landing line: "Built on what learning science agrees on."** Supporting line: "Studies of gamified learning found students learned more on average than in regular lessons. Gamify pairs that with practice questions, the strategy with the deepest research base." | Research-backed home page section without claiming Gamify itself is proven | Beth, 2026-10-24; F1 (Huang et al., 2020; Zeng et al., 2024; Sailer & Homner, 2020) |
| 45 | **Landing line: "Hard enough to stretch. Supported enough to succeed."** Supporting line: "Research shows young learners remember most when a question takes effort and they get it right. Read-aloud, a read-first pause, extra tries and tools make that happen." | Turns the accommodations into a learning feature, not just an add-on | Beth, 2026-10-24; F3 (Fazio & Marsh, 2019) |
| 46 | **Landing line: "One set. Five days. Five different games."** Supporting line: "Learning scientists agree that practice spread over days beats cramming. Play the same question set all week in a new game each day." | Simple weekly routine; answers "won't they get bored?" | Beth, 2026-10-24; F4 (Carpenter et al., 2022) |
| 47 | **Landing line: "Mistakes are free here."** Supporting line: "In a large survey, most students who had regular low-stakes quizzes said they felt less nervous at test time. In Gamify, a wrong answer never costs a point, a life or a turn." | Speaks to parents and anxious kids; honest (survey wording) | Beth, 2026-10-24; F6 (Agarwal et al., 2014, student self-report) |
| 48 | **Landing line: "Compete, team up, or play as one class."** Supporting line: "Studies found gamified learning helped whether or not students competed with each other, so you choose teams, a class goal, or head-to-head." | Reassures teachers worried about leaderboards and the kids at the bottom | Beth, 2026-10-24; F9 (Ho, Hung & Kwan meta-analysis) |
| 49 | **Landing line: "Choice and belonging, built in."** Supporting line: "A review of 35 studies found gamified learning helped students feel more in control and more connected. Kids pick the game; classes play as one team." | Self-determination theory in plain words; links student choice and Share mode to motivation | Beth, 2026-10-24; F7 (ETR&D 2024 meta-analysis) |
| 50 | **Landing line: "Instant feedback, for students and for you."** Supporting line: "Feedback is one of the most researched tools in teaching. Students see right or not yet at once; you see which question the class keeps missing." | Pairs student feedback with the item-analysis report teachers want | Beth, 2026-10-24; F5 (Wisniewski, Zierer & Hattie, 2020). Upgrade the line to "and learn the right answer" only after "Let's look back" ships |
| 51 | **Landing line: "Designed for every learner from the first sketch."** Supporting line: "Gamify follows Universal Design for Learning: many ways to see, hear and answer, and every accessibility setting is free." | District buying point (ADA Title II, UDL language in RFPs). Use as a design promise only; never quote a UDL effect size | Beth, 2026-10-24; F11 (Capp, 2017; Almeqdad et al., 2023) |
| 52 | **"What the research says" page:** a plain-language page with the findings behind ideas 43-51, each with its honest caveat and a link to the study. | Principals and grant writers need citations; showing caveats builds trust | Beth, 2026-10-24; research brief "Marketing-ready findings" |
| 53 | **One-page research handout for principals** (PDF from the page above), ending with "How Gamify will measure its own results" (research brief section 5). | Leave-behind for conferences and district meetings; sets up the pilot story | Beth, 2026-10-24 |
| 54 | **Honesty as a brand line: "We tell you what the research says, and what it doesn't."** | Stands out in a market full of overclaims; teachers distrust hype | Beth, 2026-10-24; research brief wording rule |
| 55 | **"Find the right set in seconds."** Every set is tagged by subject, grade, tags and Common Core standard, with a cover picture, so teachers filter straight to RF.1.3 or 3.NF.1. | Saves teacher time; standards alignment is what admins ask for | Teacher request, 2026-10-24 |
| 56 | **"Watch the sky fill up."** Question Tracker turns progress into a picture: every right answer adds a star to a night sky (or a fish to the ocean, an animal to the savanna in class-made themes). | A visual a pre-reader understands; great short video | Teacher request, 2026-10-24 |
| 57 | **"Sign in with your pictures."** K-1 students tap their name and two pictures, which a class can draw themselves. | No passwords, no email accounts for kids; privacy and ownership | Teacher request, 2026-10-24 |
| 58 | **"Cast, answer, reel it in."** Cast and Catch: time your cast, answer while the bobber floats, and reel in fish with real facts (a 16 cm pufferfish!). Better casts bring rarer fish, so skill and learning both pay off. | A game kids ask for by name; every catch teaches a science fact | Development, 2026-10-24 |
| 59 | **"Pick a card, tap the answer."** Game Show teams choose a card first, then tap their answer on the board, and it checks itself. No teacher judging, so the teacher can walk the room. | Shows a teacher running a live game without being stuck at the screen. |
| 60 | **"Never a game over."** Bubble Pop rescues the board when bubbles get close to the bottom, and every bubble has a shape as well as a color. | Kind to young and color-blind players; a calm contrast to games that punish losing. |
| 61 | **"Ask the class how it went, in pictures."** A one-screen class check-in: each student taps a face and an easy/just right/tricky picture. Anonymous counts only, no names. | Shows student voice without collecting student data; strong for SEL-minded schools and privacy reviews. |
| 62 | **"Your class designs the game."** Students design a theme on their own iPad (photos of their drawings, a color, a name) and send it to the teacher, who approves it before anyone plays. Credited to the class, never a student name. | The class-made-theme story, now without paper; teachers keep control. |
| 63 | **"Yesterday's misses come back today."** When a student signs in, questions they missed on an earlier day return for review, mixed into any game. Spaced review without a worksheet. | Grounded in the spacing research on the Research page; a concrete answer to "does it actually help them remember?" |

### 10A. Blog post ideas (website "Ways to use Gamify")

Direct from you (2026-10-24): a running list of blog-style articles for the
website showing teachers ways to use Gamify. Add to it whenever a use idea
comes up (same standing rule as the marketing list). Each post should show
real classroom photos (with releases), screenshots, and a step-by-step
"try it tomorrow" box. No other company names in published posts.

| # | Working title | The idea | Features it shows | Audience |
|---|---|---|---|---|
| 1 | **Design a Theme as a Class, Then Play Fractions** | Each student designs one piece of a class theme (the background, a power-up, the player piece, the board) with markers or paint, the class scans them in, and the first game in the new theme is a fractions question set. Art project and math review in one. | Theme Builder, template pages + scan, student design mode, "Designed by" credit | Teacher's idea, 2026-10-24; grades 2-6 |
| 2 | **Whole Class vs the Computer: A Friday Review Ritual** | One team, one goal: the class beats the CPU on review questions before the weekend. | Share mode, class vs CPU, read-aloud, calm mode | K-8 |
| 3 | **Can Your Class Beat the Teacher?** | Teacher plays the other side; tips for keeping it close and fun. | Share, class vs teacher | K-8 |
| 4 | **No Devices? Run a Full Review Game From One Screen** | Up to 10 teams, whiteboards for answers, teacher taps right or not yet. | Share mode, teams, undo | Under-resourced classrooms |
| 5 | **Every Student Sees the Board: Share Mirror for Students With Visual Impairments** | Set up a view-only mirror on a student's iPad with their own zoom and read-aloud; IEP accommodation tips. | Share Mirror, viewer codes, accessibility settings | Special education, TVIs |
| 6 | **Sensory-Friendly Game Time** | How to set up calm mode, sound levels and presets for students who are sensitive to sound and motion, and save them as defaults. | Gear settings, presets, teacher defaults | Special education, autism support |
| 7 | **One Question Set, Five Days, Five Games** | A week of spaced practice: Monday Match Up, Tuesday Peg Drop, and so on, all from the same set. Why spacing works (research brief). | Many games per set, Arcade, reports | All grades |
| 8 | **Differentiate Without Extra Prep** | Assign the class set to everyone plus an extra or easier set to small groups; the Arcade mixes them automatically. | Assigning sets to class and individuals, Arcade | Intervention, IEP goals |
| 9 | **Turn Game Data Into Your Next Lesson** | Use the "by question" report to find the most common wrong answer and reteach it. | Reports, item analysis, CSV | All grades, data teams |
| 10 | **Bring Gamify to Your IEP Meeting** | Pull a student's report across games to show progress and accommodations used. | By-student report, settings logged | Special education |
| 11 | **Classroom Management in Live Games** | Name dice, name approval, the Lock button with a private message, hiding the leaderboard. | Name options, Lock, live monitor | New teachers, upper elementary/middle |
| 12 | **Silly Names, Zero Drama** | Why the name dice beats typed names with young kids. | Name dice, bad-word filter | K-3 |
| 13 | **Homework Kids Actually Do** | Assign through Google Classroom with a direct link; check the live monitor in class, reports at home. | Assignments, Google Classroom share, reports | Grades 3-8 |
| 14 | **Morning Work That Runs Itself** | Students sign in to their Arcade during arrival and practice the week's sets. | Arcade, picture password sign-in | K-5 |
| 15 | **Teams Your Way: Breakout-Room Style Grouping** | Random, balanced or hand-picked teams; saving reading groups for reuse. | Team assignment, saved team sets | All grades |
| 16 | **Student Co-Designers: Kids Shape the Games They Play** | How classes gave feedback and designed features (Junior Designers plan); descriptive writing and design thinking. | Theme Builder, junior designers | Grades 3-6 |
| 17 | ~~Collect Pals, Build Habits~~ (removed with XP) | Using XP and the shop for steady practice, daily caps, closing the shop during lessons. | XP, shop, teacher controls | Paid classrooms |
| 18 | **Bilingual Review Games** | Writing bilingual question sets and switching menus and read-aloud to Spanish. | Language settings, read-aloud | ELL and dual-language classrooms |
| 19 | **Make a School-Spirit Theme** | School colors and mascot theme for spirit week, shared with the whole school. | Theme Builder, share to school | Schools, admins |
| 20 | **Why Wrong Answers Cost Nothing in Gamify** | The research on low-stakes practice, feedback and "Let's look back." | Question engine, research brief | Teachers, parents, admins |
| 21 | **Setting Up Gamify on School iPads and Chromebooks** | IT whitelist, Guided Access and Apple Classroom pairing for full lockdown. | IT page, Lock + device tools | Tech coordinators |
| 22 | **From Paper to Play: Importing Your Old Question Sets** | CSV import from spreadsheets teachers already have. | CSV import | All teachers |
| 23 | **Ways to Design a Theme** | Step by step: (1) download the theme template for the game you want (every game has its own; themes are made per game), (2) draw, paint, color or design digitally on the template, (3) upload everything to that game's Theme Builder. Tips for markers vs paint vs digital, splitting pieces across students, and scanning well. | Theme templates, Theme Builder, scan-and-cut, student design mode | Teacher's idea, 2026-10-24; all grades |
| 24 | **Teach Your Class to Report Bugs and Share Ideas** | A 10-minute lesson on the Tell Gamify button: what makes a helpful report, never typing names, sending one idea together; how student reports turn into real changes. Also posted on social media. | Tell Gamify, beta program | Teacher, 2026-10-24; all grades |
| 25 | **Why Quiz Games Work: The Science of Practice Questions** | Plain-language tour of the biggest classroom quizzing review (222 studies, nearly 50,000 students) and why a game is a way to get more practice done willingly. Cites Yang et al. (2021), Agarwal et al. (2021). | Every game runs on your question set; reports | Beth, 2026-10-24; teachers, principals |
| 26 | **Hard but Doable: Setting Supports So Young Kids Succeed** | How to choose tries, read-first pause, read-aloud and tools so K-3 practice is effortful but successful. Cites Fazio & Marsh (2019). | Tries 1-4, read-first, read-aloud, tools | Beth, 2026-10-24; K-3 |
| 27 | **Do Leaderboards Help? What 29 Studies Say About Competition** | The evidence that competition is not required, plus how to run class-vs-computer, teams, or hidden rankings. Cites Ho, Hung & Kwan; Hanus & Fox (2015); Sailer & Homner (2020). | Share teams, class goal, optional leaderboard, Versus | Beth, 2026-10-24; all grades |
| 28 | **Low Stakes, Less Stress: Practice Without Penalties** | Why wrong answers cost nothing in Gamify and what students say about low-stakes quizzing (survey, not experiment; say so). Cites Agarwal et al. (2014). Pairs with post 20. | No-penalty engine, timers off, calm mode | Beth, 2026-10-24; teachers, parents |
| 29 | **Spaced Practice in a Busy Week** | Five-minute daily routines with one set across the week; why spacing beats cramming. Cites Carpenter, Pan & Butler (2022); Cepeda et al. (2006). Companion to post 7. | One set, many games, Arcade, assignments | Beth, 2026-10-24; all grades |
| 30 | **Choice, Belonging, Growth: Motivation Without Bribes** | Self-determination theory for teachers: letting kids pick the game, playing as a class team, showing real progress, and why points alone do not build confidence. Cites the 2024 ETR&D meta-analysis on intrinsic motivation; Ryan & Deci (2000); Deci et al. (1999). | Game choice, Share, Live, progress pill, reports | Beth, 2026-10-24; all grades |
| 31 | **Gamify and UDL: Many Ways In, for Every Student** | Map Gamify's settings to UDL engagement, representation and action and expression; honest note that UDL research is promising but mixed. Cites Capp (2017); Almeqdad et al. (2023). | Settings on every game, read-aloud, text size, calm mode, Share Mirror | Beth, 2026-10-24; special education, coaches, admins |
| 32 | **What Gamification Research Gets Wrong, and How We Designed Around It** | The critics' strongest points (rewards, novelty, anxiety, guessing) and the design answer to each. Cites research brief sections 3-4 (Deci et al., 1999; Rodrigues et al., 2022; Mekler et al., 2017). | Many games per set, no prizes, guessing check, optional rankings | Beth, 2026-10-24; skeptical teachers, admins |
| 33 | **Using Gamify Data in an RTI or MTSS Meeting** | Turn per-question accuracy and item analysis into intervention groups and feedback for students. Cites Wisniewski, Zierer & Hattie (2020) on feedback. | Reports, item analysis, assigning sets to individuals | Beth, 2026-10-24; intervention teams |
| 34 | **Game Time for Students Who Need a Different Pace** | Short games, timers off, calm mode and the settings menu as access features for students with attention or sensory needs. Explicitly not a treatment claim (research brief F12). Cites Hussein et al. (2023). | Calm mode, timers, settings | Beth, 2026-10-24; special education |
| 35 | **Themes We're Looking For** | A call for class-made themes for Question Tracker and other games: an underwater scene where sea animals appear as questions are answered, a safari with plants and animals, and more ideas from the theme wish list in the development plan. How to draw one with the template and send it in. | Theme Builder, printable template, Question Tracker | Teacher idea, 2026-10-24; art teachers, classes |
| 36 | **Standards-First Review: Filter by Common Core Code** | Pick the standard you're teaching this week, filter the set library to it, and run three different games on it. | Set filters, standards, assigning sets | Teacher request, 2026-10-24 |
| 37 | **Fishing for Facts: Cast and Catch as a Timed Review** | Run a 3-minute Cast and Catch on this week's set; students compare their best catches and the fish facts they learned. | Cast and Catch, timer, reports by student | Development, 2026-10-24; K-5 |
| 38 | **Bubble Pop as a Bell-Ringer** | One right answer loads five bubbles; a 5-minute round of review questions with a game that students beg for, and the board never ends in a loss. | Bubble Pop, question breaks, reports | Development, 2026-10-24; K-8 |
| 39 | **Two-Tap Exit Tickets for Pre-Readers** | End a game with the class check-in: kids tap how it felt and if it was easy or tricky; the teacher sees the counts and adjusts tomorrow's set. | Class check-in, picture answers | Development, 2026-10-25; K-3 |
| 40 | **Design Week: Every Student Sends a Theme** | Open student design mode for a week; students photograph their drawings and send themes; the class votes and the teacher approves the winners. | Student design mode, Theme Builder approval | Development, 2026-10-25; 2-8 |
| 41 | **Unit Review Tournament (Grades 8-12)** | Game Show category grid with one set per topic as columns; class vs teacher option. Live on /ways. | Category grid, class vs teacher, reports by set | Development, 2026-10-25; 8-12 |
| 42 | **Students Write the Questions** | Groups write questions with believable wrong answers in a shared sheet; teacher imports the CSV; the class plays it. Live on /ways. | CSV import, set editor, Match Up, Four in a Row | Development, 2026-10-25; 6-12 |
| 43 | **Head-to-Head Vocabulary** | A week of vocabulary duels at a station with Four in a Row and two-player Memory Match. Live on /ways. | Versus, spaced practice with one set | Development, 2026-10-25; 6-12 |
