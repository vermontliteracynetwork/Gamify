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
- **One theme, every game.** The builder fills the shared skin slots
  (player, goal, obstacle, collectible, projectile, card back,
  celebration), so a class's hand-drawn theme skins *all* games at once.
  The preview has a game switcher to check how it looks in each.
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
new class theme refreshes every game at once, which fights the novelty
drop-off in `docs/gamified-learning-research.md` 3.4.

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

## 4F. XP and the shop (paid plans)

Direct from you (2026-10-24): students earn in-game XP over time and spend
it, the way Blooket students collect "Blooks." **Paid plans only (Plus and
Pro).** Gamify's collectibles need their own original name and art (never
"Blooks"); working name: **Gamify Pals**.

### How students earn XP
- Playing any game in a paid teacher's classroom: XP for right answers and
  for finishing games and assignments. Wrong answers never take XP away.
- Daily cap so XP rewards regular practice, not marathon grinding (Blooket
  reportedly caps daily tokens too).
- Bonus XP the teacher can give (great effort, kindness, finished
  assignment) and XP events (double-XP Friday).
- XP adds up over time and follows the student across every game in that
  classroom.

### What XP buys (looks, never advantages)
- **Pals** (collectible characters) to show on the student's profile, in
  the lobby and as their game piece.
- Avatar items (outfits, hats, accessories, including culturally diverse
  options, section 4A equity).
- Game skins for their player piece in specific games.
- Titles, badges, name banners, lobby celebrations.
- **No gameplay advantage**: XP items never make a student score more or
  win more.

### How the shop works
- **Shop with fixed prices** as the main way to get items: the student
  always knows what they're getting.
- **Optional mystery eggs**, bought only with earned XP, with the odds
  shown, and a teacher switch to turn them off. Never sold for money.
  (Surprise is engaging, `docs/gamified-learning-research.md` 2.3, but
  random paid rewards are banned by principle 3.)
- New items rotate in weekly and with seasons and themes.

### Teacher controls
- XP on/off for the classroom, shop open/closed (e.g. closed during
  lessons), mystery eggs on/off, daily cap.
- Give or adjust XP, reset a classroom at the end of the year.
- XP shown in reports (earned per game, per day) as an engagement measure.

### Rules
- **Students in free classrooms never see XP, the shop, Pals or locked
  items.** No teasers, no "upgrade" prompts to children.
- Every student in a paid classroom gets the same access; nobody can buy
  more.
- XP needs a lasting student identity (the class list), so XP is stored
  with the student's roster entry, not an email account; the teacher can
  delete it any time (privacy, section 6.6).

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
| **Player code** | Letters **and** numbers, 6 characters | `K7P2QX` | Joins as a player: Class Live, Versus on two devices, assignment links |
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
- **Tech note:** the mirror needs the same real-time server as Class Live,
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
   only, so wanting a game becomes a conversation with the teacher. XP,
   the shop and Pals stay invisible in free classrooms. (Background: the
   2021 FTC complaint against a kids' math game, see
   `docs/competitor-plans-research.md` section 3.)
3. **No real money, loot boxes or random paid rewards anywhere.** In-game
   rewards (XP) are earned by playing and answering, never bought by
   students or families. XP is a feature of the teacher's paid plan.
4. **Paywall teacher breadth, customization and insight**: more games,
   themes, reports, bigger live sessions, assignments.

### Tiers (your decisions, 2026-10-24; prices proposed)
Competitor cross-comparison and the reasoning behind each line:
`docs/competitor-plans-research.md`. Tier names are working names.

| | Free | Plus (mid tier) | Pro (top tier) | School / District |
|---|---|---|---|---|
| Teacher account (log in, saves your work) | Yes | Yes | Yes | Yes |
| Classrooms | **1** | **3** | **Unlimited** | Unlimited, school-wide |
| Students per classroom | **Up to 30** (decided 2026-10-24) | Proposed 40 | Proposed 60+ | Proposed 60+ |
| Own question sets saved | **3** | Unlimited | Unlimited | Unlimited + shared school library |
| Public question sets (published by others) | Use any | Use any, publish your own | Use any, publish your own | Same |
| CSV import | Yes (counts toward the 3) | Yes | Yes | Yes |
| Games | **Free games only** (a set list) | All games | All games | All games |
| Modes in the games you can use | All four (Class Live up to your 30 students) | All four | All four | All four |
| Themes | **Preview only**, not playable; house default theme only | Full theme library, playable | Full library + **Theme Builder** | + school brand theme |
| **XP and shop** (section 4F) | **No**, and students never see it | **Yes** | **Yes** | Yes |
| **Live monitor + Lock button** (4E) | **No** | Yes | Yes | Yes |
| Assignments (code, link, Google Classroom) | Yes, free games only | Yes | Yes | Yes + LMS sync later |
| Question sets assigned at a time, per student (class and/or individual) | **1** | **5** | Unlimited | Unlimited |
| **Student Arcade page** (play any game, questions from all assigned sets) | Free games playable; **paid games shown locked** (lock on cover, can't tap) | Yes | Yes | Yes |
| Versus on two devices | No | Yes | Yes | Yes |
| Reports | Report for every game played (all views, CSV, print), 30 days of history | Full history | Full history, trends, PDF/Sheets export | + school and admin views |
| Names, approval, rename, remove player, bad-word filter, teams | **All** | All | All | All |
| Accessibility settings (4A) and Share Mirror (4D) | **All, free** | All | All | All |
| Price (proposed, see research) | $0 | About $5/mo billed yearly ($60/yr), more month-to-month | About $9/mo billed yearly ($108/yr), more month-to-month | Quote / purchase order |
| Privacy paperwork | Standard terms | Standard terms | Standard terms | Signed data privacy agreement |

Notes:
- Removing or renaming a player and the bad-word filter stay free, so a
  free teacher can still handle an inappropriate name without the Lock
  button.
- In free classrooms the XP shop and themes are not shown to students.
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

**Phase 2: Teacher accounts + Plus/Pro**
- Classrooms and class lists, tier limits (classrooms, students, 3 saved
  sets), public question set library
- XP and the shop (Pals, avatar items) for paid classrooms
- Teacher sign-in, saved sets in the cloud, assignments with code, direct
  link and Share to Google Classroom
- Billing and plans, Pro theme library, Theme Builder
- 4 to 6 more games/activities
- Privacy policy, Terms, DMCA agent in place **before** launch

**Phase 3: Live + schools**
- The `/join` page and code system (player and viewer codes)
- Mode 1 Class Live: join codes, host screen, live leaderboard
- Share Mirror (view-only screen), first feature on the real-time server
- Live monitor and Lock button for every own-device mode (also needs the
  real-time server; strong case for Phase 2, see decision 8)
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
5. **Accounts**: teachers log in (all tiers, so free users can save their
   3 sets and 1 classroom). Students have no email accounts: they are
   entries on the teacher's class list (needed for XP over time) and join
   by code. OK?
6. **Class Live timing**: Mode 1 needs a real-time server, so it is
   planned for Phase 3. It is also the Blooket-style headline feature.
   Pull it forward to Phase 2 if it matters most for selling?
7. **Report history on Free**: every game always has a full report (your
   rule). Claudia suggests Free keeps 30 days of history and paid keeps
   everything. OK, or should Free keep everything too?
8. **Real-time server timing**: Class Live, Versus on two devices, Share
   Mirror and the live monitor + Lock button all need it. Share Mirror is an accessibility feature,
   which is a reason to bring the server forward to Phase 2.
9. **Free tier limits** (your tiers are set; three numbers to confirm):
   - ~~Free classroom size~~ DECIDED 2026-10-24: **30 students**.
   - Students per classroom on Plus and Pro (Claudia proposes 40 and 60+).
   - Prices: about $60/yr for Plus and $108/yr for Pro, in line with the
     market (`docs/competitor-plans-research.md`).
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
   account. XP, reports, the Lock and now the **student Arcade sign-in**
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
   voice service) cost money per use. At $60/yr per paid teacher, and many
   free teachers costing money too, the numbers need checking now. Free
   tier read-aloud may need the device voice instead.
5. **Smallest sellable version (MVP) and a target date.** Back-to-school
   (August) is when teachers try new tools. Work backward: which games,
   modes and tiers must exist on day one, and what waits.
6. **Who builds the art and sound.** 20+ games, house themes, Pals and
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
    a student refreshes, or the teacher's laptop sleeps during Class Live.
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
| 14 | **"Themes that change every game at once,"** including your school colors and mascot. | Headline Pro feature; personal and school pride | Section 4 |
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
| 27 | **"Collect Pals with every right answer."** | The student-pull feature that gets kids asking their teacher to play | Teacher, 2026-10-24; section 4F |
| 28 | **"We never advertise to your students."** No upgrade prompts, no locked items, no ads, ever, on any plan. | Trust with teachers, parents and districts; a contrast with criticized competitors (without naming them) | Section 5 principle 2 |
| 29 | **"Looks, not advantages."** XP buys style, never a better score. | Fairness parents and teachers care about | Section 4F |
| 30 | **"Free forever: one classroom, every accessibility feature, and up to 10 teams on one screen."** | A generous, honest free tier headline | Section 5 |
| 31 | **"Your class designs the game."** Draw it with markers and paint, scan it with an iPad, and play it in every game. | Hero feature for marketing: a photo of kids painting next to the same art in the game sells itself | Teacher, 2026-10-24; section 4 Theme Builder |
| 32 | **"Designed by Room 12."** Every class-made theme carries its designers' credit. | Pride and ownership; shareable moments for families and school social media | Section 4 Theme Builder |
| 33 | **"One drawing, every game."** A hand-drawn theme skins all of Gamify's games at once. | Shows the platform's scale in one sentence | Section 4 |
| 34 | **Photo and video idea:** students painting a template page, scanning it, and seeing their art drop onto the board seconds later. | The demo video for the website and conferences (with signed photo releases) | Teacher, 2026-10-24 |
| 35 | **"Every student gets their own Arcade, filled with exactly what they're working on."** Assign sets to the class or to one student, and every game draws from them. | Differentiation teachers can feel; strong for IEPs and intervention groups | Teacher, 2026-10-24; Mode 3 |
