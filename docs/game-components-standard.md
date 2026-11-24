# Universal game components standard (proposal)

Design Chair, 2026-11-24. Teacher's request (verbatim): "i want to audit,
review, and apply a consistent standard for the universal game components so
the layout is consistent across all games. i want the design chair to
reference the referencing games (blooket, baamboozle, wordwall) on how theirs
are and also look at figma and other sites and apply psycology of menus and
design to make sure its okay. all these should be in their own tab, define the
animations, motion, sounds, etc. to each and give preview ability. make sure we
have a universal standard".

Status: PROPOSAL. Nothing here changes a live game until she approves. The
`/brand` tab with live previews is being built by another agent from this file.

**The decision in one line.** Every game screen uses the same four HUD zones:
**A** top strip (who/score left, round meter middle, tools right), **B** right
rail (scoreboard rows, then held power-ups, then the game's one action card),
**C** bottom-center feedback line, **D** center stage for one card at a time
(turn card, power-up card, question, results). The board fills what is left.
On iPad portrait and phones, rail B docks under the board as one row.

---

## 1. Audit: what the live games and mockups do today

Ranked by how confusing the difference is for a K-3 player or a teacher at the
projector (worst first). File:line references are to the repo at 2026-11-24.

### 1.1 Held power-ups (worst: four behaviours for one idea)

| Where | What it does | Ref |
|---|---|---|
| Engine `PowerUpTray` | Not a tray: after 900 ms x pace it fires the next held power-up by itself and shows a centered card; nothing is tappable | `src/engine/HeldPowerUps.tsx:76-96` |
| Match Three | Tray fixed bottom-left, `w-[min(14rem,40vw)]`, outside the board area | `src/games/match-three/MatchThree.tsx:385` |
| Four in a Row, Bowling | Under the scoreboard in the 260px right rail | `src/games/four-in-a-row/FourInARow.tsx:402`, `src/games/bowling/Bowling.tsx:330,523` |
| Board Game | Rendered outside the layout grid (floats over everything) | `src/games/castle-quest/CastleQuest.tsx:369,505` |
| Bubble Pop | Power-ups can be switched on in setup, no held tray in play | `src/games/bubble-pop/BubblePop.tsx:28` (import only) |
| Mockup "Your power-ups" strip | Butter strip, label left, 44px square sticker buttons, name only in a hover `title=` tooltip | `src/brand/GameMockups.tsx:218-224` |
| Mockup `HeldTray` | Same strip as a column or a row, label "Power-ups", "Power-up ready", "Ready", "Mia's" | `src/brand/GameMockups.tsx:292-298`, used at 358, 507, 515, 646, 655 |
| Mockup score row | A held power-up as a 30-34px badge inside the team's score row | `src/brand/GameMockups.tsx:49`, `:427` |

Why it confuses: the mockup tells kids "tap your power-up", the live game uses
it for them. The `title=` tooltip never shows on an iPad (hover only). Label
words change per game.

### 1.2 Score and turn display (three components, plus one unused)

| Game | Today | Ref |
|---|---|---|
| Match Three, Bubble Pop (solo) | `TopStrip` above the board: 4xl score, one dash per move grouped by round | `src/engine/TopStrip.tsx:11-37`; `MatchThree.tsx:303`, `BubblePop.tsx:322` |
| Game Show | `ScoreBoard` in a 280px right rail | `src/games/game-show/GameShow.tsx:427,530` |
| Four in a Row, Bowling | `ScoreBoard` in a 260px right rail | `FourInARow.tsx:400-401`, `Bowling.tsx:520-521` |
| Board Game | No scoreboard at all (teacher 2026-11-16); die alone in a 220px column | `CastleQuest.tsx:433-443` |
| Question Tracker | Sky only; no strip, progress is screen-reader text | `src/games/practice/StarQuiz.tsx:128-160` |
| `SoloPanel` | Built for "every solo game", used by no live game (only `src/lab/LabGame.tsx`) | `src/engine/SoloPanel.tsx:11-53` |
| Mockups | Four different strips: `SoloStrip` + `Stat` boxes (`GameMockups.tsx:272-288`), the universal `Tracker` pill (`UniversalViews.tsx:109-125`), `FrameTracker` (`GameMockups.tsx:626-636`), `MiniRace` rows with "12 to go" (`GameMockups.tsx:226-233`) |

### 1.3 Turn glow (three looks for "your turn")

- THE glow (teacher 2026-11-24): `.turn-rays` + `.turn-halo` (`src/index.css:590-606`), used by the turn card (`src/engine/ShareQuestion.tsx:210-211`) and every mockup (`src/brand/mockKit.tsx:65-74`).
- Live `ScoreBoard` row instead pulses a flat lemon box-shadow every 1.6 s (`src/engine/ScoreBoard.tsx:248,260-261`).
- Live Board Game die glows with a `drop-shadow(0 0 14px #fdfd94)` and bobs (`CastleQuest.tsx:375-376`).
- Mockup `TurnPill` and `RollPill` wrap the glow in a pill with words (`GameMockups.tsx:37-43`, `:638-640`).

### 1.4 The game's main action button

- Mockup roll card: team name, die on a blue blob patch, a purple `MainBtn` "Roll" (`GameMockups.tsx:208-216`). Purple conflicts with the 2026-11-24 rule that go buttons are yellow `#FDFD94` (`mockKit.tsx:56-57`).
- Live Board Game: the die itself is the button, no text, no box (teacher 2026-11-13, `CastleQuest.tsx:371-381`).
- Live Bowling Still mode: "Throw" pill in `bg-accent` (`Bowling.tsx:510`).
- Live Four in a Row: tap a column, no button.

### 1.5 Feedback line (five places)

- Board Game: pill at bottom 6% of the board, 2xl-3xl, spring 380/18, auto-closes after 1.6 s (`CastleQuest.tsx:476-482`).
- Match Three: small `text-sm` pill on the top edge of the board (`MatchThree.tsx:306`).
- Question Tracker: center of the screen, 2xl-3xl (`StarQuiz.tsx:132-139`).
- Four in a Row: status box inside the right rail (`FourInARow.tsx:403-405`).
- Bowling: armed power-up chips at the top of the lane (`Bowling.tsx:512-516`).

### 1.6 Power-up card (two shapes, two dismiss rules)

- Live `PowerUpCard`: 19rem, 128px art, name, one line, X at top right, tap anywhere closes, POP_IN spring, entrance by the art's motion (`src/engine/PowerUpPop.tsx:110-140`). Sound: the power's own clip or `win` (`PowerUpPop.tsx:143-150`).
- Mockup `PowerMoment`: 400px, blob patch, butter ring, a yellow "Use it" button or choice chips (`GameMockups.tsx:805-818`). Tornado card text: "Whoosh! Every player lands on a new square."
- Board Game wheel picker: its own dialog with a different spring (320/16) and choice buttons (`CastleQuest.tsx:383-400`).

### 1.7 Round meter (four drawings, three wordings)

- `TopStrip` dashes, 10px tall (`TopStrip.tsx:24-34`).
- `RoundMeter` big "2/6" plus a periwinkle-to-mint gradient bar (`ScoreBoard.tsx:220-237`).
- Mockup `Meter`: one 22px track, Kelly done, Lemon current with a marker (`mockKit.tsx:76-100`).
- Words: "2/6" (live), "Round 2 of 3" (`UniversalViews.tsx:119`), "Frame 4 of 10" (`GameMockups.tsx:632`), `Stat` "Round / 2 of 3" (`GameMockups.tsx:357`).

### 1.8 Smaller differences

- Score pop: scale 1.25 (`TopStrip.tsx:22`), 1.3 (`SoloPanel.tsx:31`, `ScoreBoard.tsx:271`). **Bug:** `ScoreBoard.tsx:271` pops even in Still (its `initial` is not gated).
- Score size: 4xl (TopStrip), 4xl-6xl (SoloPanel), 2xl chip (ScoreBoard), 5xl (mock `SoloStrip`), 56px (mock `Tracker`).
- Corner tools: live = Full screen, Access, Gear at 44px (`CastleQuest.tsx:488-492`, `StarQuiz.tsx:141-145`); mockups = Gear, Full screen, X (`GameMockups.tsx:28-35`). Different set, different order.
- Pop-up springs: POP_IN 170/20 (`src/engine/pace.ts`), 320/16 (wheel), 380/18 (banner), Game Show prize 150/11. Presets exist in `src/ui/motion/presets.ts` but games type their own.
- Sounds: `win` is used for nearly every good thing (row clear, star goal, power-up, game won), so reward size does not match importance (`MatchThree.tsx:95,122,162,227`; `BubblePop.tsx:82,122,183,200`; `Bowling.tsx:116,281,311`). The 2026-11-23 universal UI pack and the cleared Triple Treat library (`public/sounds/library/`) are barely used in play.
- Results: one `ResultsModal` everywhere (good: `src/engine/ResultsModal.tsx:167-208`); the mockup adds stat chips and a winner glow (`GameMockups.tsx:822-842`).

---

## 2. Research

### 2.1 Competitors (idea only; never their art, names, sounds or exact look)

Every competitor host was blocked by this session's network: help.blooket.com,
blog.baamboozle.com, wordwall.net (and www.figma.com, www.nngroup.com,
www.w3.org, m3.material.io, www.gameuidatabase.com all failed to resolve, even
though the task said they were allowed). I could run web searches but could
not open pages, so these are **search-result summaries, not opened sources**,
plus memory. Confirm before quoting any of it to customers.

- **Blooket** (search summaries of its Help Center game overviews; [Racing](https://help.blooket.com/hc/en-us/articles/42155567650967-Game-Overview-Racing), [Laser Tag](https://help.blooket.com/hc/en-us/articles/34103201098519-Game-Overview-Laser-Tag), [Mini Mine](https://help.blooket.com/hc/en-us/articles/35012457801111-Game-Overview-Mini-Mine), not opened): power-ups arrive from answering, the host can turn them on or off, rankings open from one Stats button instead of sitting on screen, and a level timer sits at the bottom. Lesson: one place for rank, opened on demand on small screens; power-ups are a host setting.
- **Baamboozle** (search summaries of teacher guides such as [Educators Technology review](https://www.educatorstechnology.com/2023/01/baamboozle-review-for-teachers-tons-of.html) and [Baamboozle 101](https://blog.baamboozle.com/baamboozle-101), not opened): one projected tile board, teams take turns, team scores stay visible, power-ups are surprises revealed on a tile (gain, lose, swap), the teacher marks right or wrong. Lesson: on the projector the board is the hero and the team scores are a fixed column; a surprise reveal is its own full moment.
- **Wordwall** (search summary only; no page opened): almost every template has a timer in its options panel, and templates share one options and leaderboard layout. Lesson: the same setting lives in the same place across many templates; that sameness is the product. (From memory, approximate: the timer and score sit in a fixed top bar of every template.)
- Figma: www.figma.com blocked; her three Figma Community files in `docs/design-references.md` not opened.

### 2.2 Menu and HUD psychology (from memory unless a link is given; nothing invented)

| Principle | What it means for the HUD |
|---|---|
| Consistency and standards, Jakob's law (NN/g heuristic 4, from memory) | Kids carry habits from one game to the next. Same part, same place, same look in all seven games. |
| Recognition over recall (NN/g heuristic 6, from memory) | Score, turn and power-ups stay visible; never hidden behind hover. |
| Visibility of system status (NN/g heuristic 1) | Whose turn, round left and what a power-up did are always on screen. |
| Hick's law | Show at most one action per moment (Roll, or Use it, or the answers). Tray holds at most 3 cards. |
| Fitts's law | The action a child needs most (die, Use it) is the biggest target and closest to the board. |
| Gestalt proximity and common region | Everything about one team sits in one row; everything about "me now" sits in rail B. |
| Visual hierarchy, figure-ground | Board first, score second, tools last (quiet, small, corner). |
| Doherty threshold (about 400 ms) | Every tap answers within 100 ms (press squash + tap sound); a card arrives within 400 ms. |
| Feedback timing (immediate feedback for novices, Hattie and Shute, from memory) | Right or wrong shows at once, then the explanation. |
| Reward size matches importance (operant conditioning, overjustification risk) | Small sound for a match, medium for a power-up, big only for a win. Fewer big moments keep them special. |
| Seductive details (Sundararajan and Adesope 2020 meta-analysis, 58 studies, lower learning with interesting but irrelevant extras; [search result, not opened](https://link.springer.com/article/10.1007/s11251-023-09632-w)) | No idle motion near the question; idle loops only on the "you can act now" thing. |
| Cognitive load for K-3 (Sweller, from memory) | One new card at a time in zone D; no stacked pop-ups. |
| Color plus shape (WCAG 2.1 1.4.1, from memory) | Turn = glow AND position AND aria; teams = color AND icon; meter = filled AND hollow. |
| Target size (WCAG 2.2 2.5.8 minimum 24 px; 2.5.5 enhanced 44 px; Apple 44 pt, Android 48 dp, from memory) | Gamify floor 44 px for anything a student taps; 56 px for the main action on iPad. |
| Reduced motion (WCAG 2.3.3, from memory) | Every motion has a Gentle and a Still version. |

---

## 3. The standard

### 3.1 HUD zones (every game, every device)

```
 laptop / big screen / iPad landscape           iPad portrait / phone
+--------------------------------------------+  +---------------------+
| A  score/turn   | round meter |   tools    |  | A score | meter |tools|
+--------------------------------+-----------+  +---------------------+
|                                |  B rail   |  |                     |
|         board (stage)          | scores    |  |     board (stage)   |
|                                | tray      |  |                     |
|           C feedback line      | action    |  |   C feedback line   |
+--------------------------------+-----------+  +---------------------+
   D = centered card over a 40% ink dim         | B dock: action|tray|rows |
                                                +---------------------+
```

| Zone | Laptop (1280 x 800) | Big screen | Short laptop (1190 x 540) | iPad landscape | iPad portrait / phone |
|---|---|---|---|---|---|
| A top strip | full width, 3.5rem tall, 0.75rem from top | 4.5rem | 3rem | 3.5rem | 3.25rem / 3rem, meter shrinks first |
| B right rail | 16rem wide | 18rem | 14rem | 15rem | becomes bottom dock, 1 row, 5.5rem tall, scrolls sideways if >4 teams |
| C feedback | centered, bottom 6% of the board, max 86% width | same | same | same | same, above the dock |
| D card | centered, max 26rem wide (power-up), 60rem (question) | scales with root rem | must fit 540px tall | same | 92vw |

Rules: sizes in rem (root follows the screen, `src/index.css`). Nothing in zone
A or B ever covers the board. Solo games with no team rows still keep rail B
for the tray and the action card; if both are empty the board takes the width.

### 3.2 Components

Colors are palette PP (`src/brand/PaletteProposal.tsx`): ink `#1d1a33`, paper
`#fffaf0`, lemon `#fabe37`, go yellow `#fdfd94`, butter `#fff1b8`, kelly
`#22b04a`, Gamify purple `#7a88fe`, blue crystal `#bfdff3`, quiet `#57506e`.
Type: Grow Year (all caps) for numbers that matter and card titles, Inclusive
Sans bold for labels. Motion presets from `src/ui/motion/presets.ts`; times
are Normal speed, multiplied by `pace()` on game stages. "Gentle" = the
default reduced setting; "Still" = no movement, fades of 0.15 s or less only.

| # | Component | Zone, anatomy | Sizes (laptop / iPad portrait) | States | Motion: enter / idle / exit (Gentle, Still) | Sound | Research reason |
|---|---|---|---|---|---|---|---|
| 1 | Top strip | A. Paper pill, 3px ink edge, 0 4px 0 ink lift. Left: just the name on a Butter chip ("Team Sky", never "Team Sky's turn"), the score (solo) or the class goal (live). Middle: the meter with NO words over it (no "Round 2 of 3"; the label lives in its aria-label). Right: the one tool group. | 4rem tall laptop, 4.5rem big screen, 3.5rem short laptop; team icon 2.25rem with no circle | normal, last round (meter marker pulses once) | fades up 0.7 s ease-out on game start; the Butter chip moves to the next player over 0.4 s; no idle | none | Consistency, visibility of status; fewer words for pre-readers |
| 2 | Meter | Inside A. One 22px track (`mockKit.tsx Meter`), a segment per round, done Kelly, current Lemon with marker, later = track. No numbers on it. | 22px tall, 22rem / 12rem wide | per round | fill width 0.5 s ease-out per step; Still: jump | none (the round banner has the sound) | Goal-gradient, color plus shape (hollow vs filled) |
| 3 | Scoreboard rows | B. One row per team: the team icon (shape plus color, or piece art) with no circle border or white backing, whole name, score Grow Year 1.75rem. No crown, no held power-up badge, no tip or rule line under the rows. Order never changes mid-game. | row 3.5rem min; icon 2.5rem; dock: chips 3rem | normal, current player (Butter #FFF1B8 shading: the only turn signal), computer thinking (three dots) | rows fade in 0.12 s apart; shading moves 0.4 s; no idle | none (score pop has it) | Proximity and common region; one signal for whose turn |
| 4 | Turn signal | NO turn banner and no turn directive anywhere ("Team Sky, pick a card!" is gone). The Butter shading on the current row (3) and the Butter name chip in A are how kids know whose turn it is. | as 1 and 3 | per player | shading moves 0.4 s | none | One cue, one meaning; less text for pre-readers |
| 5 | THE glow (winner only) | `.turn-rays` (240%) + `.turn-halo` (170%) fully behind the winner's icon in the winner box. Never on turns, never a flat ring. | scales with the icon | on/off | rays spin 10 s a turn, 30 s Gentle/Still; halo breathes 2.4 s, 5 s | none | One signal, one meaning (consistency) |
| 6 | Power-up cards (no tray) | B under the rows (dock: middle). Each earned power-up is its own plain square card: no tray panel, no yellow background, no "Your power-ups" or "tap one to use it" text. Up to 3. Hidden when none. Each WAITS until tapped. | card 5rem square laptop, 5.5rem iPad portrait | hidden, usable now (gentle bob), not now (dashed, 45% faded), pressed (scale 0.95) | lands 0.7 s ease-out, 0.12 s apart; bob 1.8 s; Calm/Still no bob | `swipe` when it lands, `tap` on press | Recognition over recall; Hick (max 3); autonomy (she chose tap-to-use) |
| 7 | Square power-up card anatomy | Inside 6. Paper, 2.5px ink, 0 3px 0 lift; the crayon art (no circle backing) at 50% of the card; the name under it, at least 13px bold, always visible (no hover-only labels on iPad). | 5rem; target over 44px | as 6 | PRESS | as 6 | No hover-only info on touch (iPad first) |
| 8 | Power-up pop card (earned) | D. Today's `PowerUpCard`, kept: 19rem, art 8rem on a blob patch, Grow Year name, one line, X 44px. | 19rem / 86vw | shown until tapped | enters by the art's own motion (spin, wiggle, bob, sparkle) with POP_IN; Still: fade 0.15 s; exit fade + scale 0.85 | the power's own clip (`board/magnet`, `board/wind`, `board/chest`) else `library/success-power-up/power-up-fx-1.mp3` (proposal; replaces `win`) | Surprise needs its own moment (Baamboozle reveal idea); reward sized medium |
| 9 | Power-up action card (needs a choice) | D. Same card as 8, 26rem, plus one yellow `#FDFD94` "Use it" button 3.5rem tall or up to 4 choice buttons (badge + name, 3.5rem). The wheel picker and Pop Out use this one card. | 26rem / 92vw | waiting, chosen | as 8; choices popIn stagger 0.06 s | open on show, `tap` on choice, then the power's clip | Hick: one decision per card; Fitts: big buttons |
| 10 | The die | B bottom (dock: left). Just the die: no card, no team name, no Roll button. The whole die is the tap target; tap rolls it. Every die wiggles gently on hover (hover devices only) so kids see it rolls. | die 9rem laptop, 7rem rail, 5.25rem phone | can roll (hover wiggle), rolling, rolled, computer rolling (no wiggle) | hover: 0.9 s loop, 7 degrees and 2px; roll: tumble and bouncy land 0.55 s; Calm and Still: no wiggle, the number changes | `board/dice` | Affordance and signifiers (Norman); fewer parts per moment |
| 11 | Score pop | A or B score chip. "+20" floats from the place it was earned to the score, then the number pops. | text 1.75rem | small (<20), medium, big (round goal) | number scale 1.25 to 1 snappy; float 0.6 s ease-out; Still: no pop, number just changes | small: none (the action already sounded); medium: `library/match/` step; big: `win` | Reward size matches importance |
| 12 | Answer tile | Question card (D). Letter circle (color + letter), text left-aligned, 5rem min height, 3px ink. | 5rem / 7rem tall | idle, hover/focus, chosen, right (Kelly + check), wrong (fades 40%, never red X) | PRESS; right: bouncy pop 1.08; wrong: gentle 4px shake 0.3 s, Still none | right `answers/level-up.mp3`, wrong `answers/boing.mp3` (today's, keep) | Mistakes are safe; dual coding (letter + color) |
| 13 | Feedback line | C. One pill, Grow Year 1.5rem, words only (no star icon, e.g. "Three in a row!"), Lemon (good) or paper (neutral), never red. Computer turns read "Goofy Lamp is thinking..." with the computer's fun name (Goofy Lamp, Silly Fox, Happy Rainbow, Sleepy Cloud, Bouncy Sock, Wiggly Worm; a new one each game), never "Computer". | 1.5rem; 3.5rem tall | good, neutral, waiting (three dots) | rise 16px and fade 0.6 s; stays until the next action; Calm: 150 ms fade | follows the event | One place to look (proximity); playful names build warmth (relatedness) |
| 14 | Timer | A, left of the tools, only when the teacher turns timers on. Ring 2.5rem + seconds. Last 10 s: ring turns orange, no flashing. "3 minutes left" toast stays as today (`src/engine/playClock.tsx:52-55`). | 2.5rem | running, last 10 s, done | ring drains linearly; Still: no pulse | `tap` at 3 min and 1 min (today's) ; no ticking | No fake urgency; timers are optional (teacher) |
| 15 | Winner box / results | D. The title ("TEAM SKY WINS!", Grow Year caps 2.5rem), the winner's icon (no circle or backing) in THE glow, then ONLY the score or XP centered under it in Grow Year, slightly smaller than the title (2rem). No stat chips. Play again (yellow), New game, Review N missed. | 30rem / 92vw; icon 7rem | win, tie, solo (stars or XP) | 0.7 s ease-out; confetti at edges only (Celebrations setting); stays until a button is tapped | `win` (the one big sound) | Peak-end rule; one number is remembered, five are not |
| 16 | Tool group and hint | A right, every game and mockup, one order: Accessibility, Hint (lightbulb), Settings, Full screen, Close; 44px buttons (the touch minimum; she asked for slightly smaller than the old 48px) with 14px between. The lightbulb opens a small tips card (the game's rules and tips, e.g. "Fill a row for +10"), shown by itself once at the first turn, then only on tap, closed with "Got it". Gear opens Settings over a dim; timers and the computer stop. | 44px; tips card 22rem / 92vw | open, closed | Dialog preset 0.7 s; Calm: fade | `open` / `close` | Consistency; tips on demand keep the board clean (cognitive load, Mayer coherence) |

Universal motion table (one source, `src/ui/motion/presets.ts`): cards POP_IN
(170/20/1.1), buttons snappy (420/28), pieces and rewards bouncy (260/12/1.2),
panels soft (120/24). Durations: fast 0.18 s, base 0.32 s, slow 0.6 s. No game
types its own spring for a universal part.

Universal sound slots (ui pack `public/sounds/ui/*` and engine `Effect` names
in `src/engine/feedback.ts`): tap (`ui/select`), open, close, cancel, swipe,
error (`ui/error`, as `blip`), right, wrong, dice, power-up (proposal:
`library/success-power-up/power-up-fx-1.mp3`, ledger-cleared 2026-10-31),
round done (proposal: `library/success-power-up/new-level-fx-1.mp3`), win.
Only the win uses `win`.

### 3.2a Slower pop-ups, tap to close, the computer's turn (teacher, 2026-11-24)

Her words: "the presented menus, text pop ups, etc. need to be slower, give more
time for reading and require tap to close. give the students and the teacher
time to process as the computer makes a turn, and slow everything down." And:
"power ups should wait for tap." These values replace the enter and dwell
times in the table above wherever they differ.

| What | Enter | Stays | Exit | Reduced (Gentle / Calm / Still) |
|---|---|---|---|---|
| Power-up pop card (8), action card (9), turn card (4), winner box (15), pause message | 700 ms ease-out (cubic-bezier 0.22, 1, 0.36, 1), opacity 0 to 1 and scale 0.92 to 1, no spring snap | until tapped: a yellow `#FDFD94` "Continue" (or "Got it", or the choice buttons) 3.5rem tall; never auto-closes | 350 ms fade and scale to 0.96 | Gentle: same timing, no scale. Calm and Still: 150 ms fade only |
| Feedback line (13) | 600 ms rise 16px + fade, ease-out | stays until the next action or a tap; a waiting line ("Goofy Lamp is thinking...") stays for the whole computer turn | 300 ms fade | 150 ms fade |
| Choice buttons inside a card | stagger 120 ms after the card has landed (700 ms) | until tapped | with the card | appear with the card, no stagger |
| Held power-ups (6, 7) | earned card lands in the tray (600 ms ease-out); nothing fires by itself | waits in the tray until the player taps it; the name stays visible under the art on every device | taps open the action card (9) | no bob; Still: no movement |
| Computer's turn | the feedback line shows "Goofy Lamp is thinking..." (the computer's fun name) with three dots | 2.5 s pause (2 to 3 s by game speed) before its move | the move plays at normal speed, then a 1.5 s pause with the result line ("Goofy Lamp rolled a 4") before the Butter shading moves to the next player | the same pauses (they are reading time, not motion); dots do not pulse in Still |

Research: reading speed of early readers (roughly 50 to 100 words a minute
in grades 1 and 2, from memory, not measured here) means a one-line card needs
several seconds, so timing must belong to the reader (WCAG 2.2.1 Timing
Adjustable; no auto-close). Slower, eased entrances let the eye follow where a
card came from (continuity, Gestalt common fate) without the startle of a snap.
A visible computer pause keeps cause and effect readable (Norman's gulf of
evaluation) and gives the teacher a beat to talk.

### 3.2b Game components round (teacher, 2026-11-24, verbatim list)

Her list replaces anything above that disagrees. Words: "Prize chest" everywhere
(never "Treasure chest"); "+100" (never "+100 for you"); "Continue" (never "Tap
to continue"). No turn banner or turn directive anywhere: Butter shading on the
current row and the name chip is the turn signal. Player icons never wear a
circle border or white backing. No crown and no power-up badge on the
scoreboard. No tip or rule lines under a scoreboard: tips live behind the
lightbulb (row 16). Power-ups are plain square cards with no tray, no labels and
no helper text, and their art has no circle backing. The die is the whole roll
control and wiggles on hover. Computer players have fun rotating names. The
winner box shows only the score or XP under the winner icon. Live previews:
`/brand` Game components tab (`src/brand/GameComponents.tsx`); shared parts in
`src/brand/mockKit.tsx` (`GameTools`, `PowerCard`, `QuestionCard`, `Meter`,
`TurnGlow`, `DieWiggle`, `cpuName`, `TURN_SHADE`).

Research: removing the turn banner and tip lines cuts redundant on-screen text
(Mayer's coherence and redundancy principles, from memory); one cue for whose
turn keeps a single meaning per signal (consistency, NN/g heuristic 4); a 44px
target is the smallest Apple's HIG allows (from memory) and passes WCAG 2.5.5.

### 3.3 Per-game mapping

| Component | Game Show | Board Game | Match Three | Four in a Row | Bubble Pop | Bowling | Question Tracker |
|---|---|---|---|---|---|---|---|
| A top strip | name chip + meter (no words) | name chip + meter | score + meter + stars | name chip, no meter (no rounds) | score + meter | name chip + ten-segment frame meter (no "Frame 4 of 10" words) | class goal "18 of 30" + meter (Live) or my stars (Solo) |
| B rows | teams (Butter = turn, no badge) | race rows "12 to go" (teacher to decide, see challenge) | none | 2 players | none | ten-frame sheet replaces rows (teacher 2026-11-23) | Live: "12 playing" |
| B power-up cards | yes | yes | yes | yes | yes | yes | no power-ups |
| B action | none (tap a card) | the die alone | none | none (tap a column) | none (aim on board) | Still: Throw button | none |
| C feedback | prize line | Roll again, Lose a turn | combos, "No moves" | "Pick a piece to pop" | "New row!" | "Strike!" | "Three in a row!" (no star icon) |
| D cards | prize card, tips, question, results | power-up, action card, tips, question, results | power-up, tips, question, results | power-up, tips, question, results | power-up, tips, question, results | power-up, tips, question, results | tips, question, results |
| Timer in A | if on | if on | if on | if on | if on | if on | Live clock |

Territory (Live, 2026-11-24) uses: A = join code pill, class goal meter (Cooperative) or the Cats and Mice counts (Competitive), the tool group; no rows, no power-ups; C = "Caught one!"; D = tips, question (student device), results (the room fills with the winner's color).

### 3.4 Changes needed in the live games (ranked)

1. Make `PowerUpTray` a real tray in rail B (tap to use, 3 max, names visible, no hover tooltip), or decide it stays automatic and remove the tray from every mockup. Today the two disagree (`HeldPowerUps.tsx:76-96` vs `GameMockups.tsx:218`).
2. One `GameHud` layout wrapper that places zones A to D; move every game onto it. Board Game and Question Tracker get a top strip; Match Three's tray leaves the bottom-left corner (`MatchThree.tsx:385`).
3. Replace the ScoreBoard row's flat box-shadow pulse with THE glow (`ScoreBoard.tsx:248,260`) and gate its score pop on Still (`ScoreBoard.tsx:271`, bug).
4. Replace `TopStrip` dashes and `RoundMeter` with the one `Meter` (22px) and the one wording "Round 2 of 3" (or "Frame", "Card"); retire unused `SoloPanel` or make it rail B for solo.
5. One feedback line component in zone C; move Board Game banner, Match Three note, Four in a Row status, Bowling chips and Question Tracker streak note onto it.
6. One action card for every power-up choice (wheel picker, Pop Out) on POP_IN; remove the 320/16 and 380/18 one-off springs.
7. Corner tools: one set and order (Accessibility, Hint, Settings, Full screen, Close; 44px, 14px apart) in zone A on every game; the mockups now use it (`mockKit.tsx GameTools`).
8. Sound sizes: stop using `win` for matches, power-ups and round goals; map to the slots above after she auditions them on the `/brand` sound board.
9. Roll card: if the label button stays, it is yellow `#FDFD94`, not purple (`GameMockups.tsx:213`).

### 3.5 Challenge for the teacher

Automatic power-ups (2026-11-07) versus a tap-to-use tray: self-determination
theory says choosing when to use a power-up builds autonomy, and holding a
visible reward drives anticipation. Automatic firing is calmer and keeps the
pace for a room of 25. Which matters more in a class turn: speed, or the kid's
choice? A test: run one class with each and count how often a turn stalls.
Second question: the Board Game has no scoreboard by her 2026-11-16 rule, but
the mockup shows "12 to go" rows. A race with no visible standing removes the
goal-gradient pull for the kids behind; one quiet row per team may help more
than it clutters.

## 3.6 Phone (390 x 844, teacher 2026-11-24: "phones need a layout")

Every game and universal view has its own phone layout on `/brand`, drawn at
real size (390 x 844) through `DeviceSet` / `useFrame()` / `usePhone()` in
`src/brand/mockKit.tsx`; never the iPad portrait design scaled down.

| Part | Phone rule | Why |
|---|---|---|
| Text | Never below 13px at real size; questions 21 to 28px, answers 22px | Apple HIG 11pt floor plus WCAG 1.4.4 (from memory); a 6-year-old reads at arm's length |
| Touch | Every tap target 44px or more (rounds stay 44px, her approval) | Apple HIG 44pt, WCAG 2.5.5 |
| Scrolling | None inside a game screen; boards size to the width | her rule (2026-10-24) |
| Zone A | One top row: who or what left (score pill, roll chip, meter or join code), then `PhoneTools`: the Hint (in-play only) and one Menu round holding Settings (accessibility inside), Full screen and Close | five rounds plus a score do not fit 390px; Hick's law, fewer choices at once |
| Zone B | The scoreboard collapses to one compact row of chips (team badge plus score; names only for two sides); the active player's chip is Butter. Power-up cards become a small row of squares (`PowerCard` 52 to 66, so 68 to 86px) | the rail docks under the board (section 3.1) |
| Board | As wide as the screen allows (Game Show 3 x 4 cards, Board Game path 346px, Match Three 47px cells, Four in a Row 44px holes, Bubble Pop 330px, Bowling sheet shows the five frames around the current one plus the total, the ten-frame meter shows the whole game) | figure-ground; the board is the figure |
| Question card | 358px wide: icon and name (plain, two lines allowed), Settings, the Listen pill; the question in a fixed 200px block; four answers in one column, 60px tall | one column keeps reading order and big targets |
| Overlays | Power-up, results, settings and pause cards are 330 to 350px wide; titles fit one line (`FitTitle`), long ones wrap to two balanced lines; results buttons: Play again full width, New game and Review side by side | nothing cut off, nothing scaled below 13px |
| Start menus | Stacked and centered ("stack center"): title, meter, Settings, Full screen and Close centered under it; cards in one column (row cards) or a 2-up grid; Back and Next share a row, a long start button wraps above Back | Gestalt common region; one column on narrow screens |
| Site top bar | Logo plus one Menu button (the welcome puts its Full screen and Settings rounds in that row, so the title gets its own line) | her rule (top bar on every start menu) |
| Join | No keypad of ours: six code boxes with a blinking caret and the device's own number keyboard sliding up; Go above it | her rule (2026-11-24) |

Shared parts added for this: `PhoneTools`, `usePhone`, `FitTitle`, `IconBadge`
(one center for icon and background, optical nudges for the lightbulb, play,
star and heart), `PowerCard` at 1.3x with separate art and name areas, and
`MenuGo disabled` for card-choice steps (Next is off until a card is picked).

## Sources

Opened this session: none (every web host failed to resolve). Search results
used, not opened: the Blooket, Baamboozle and Springer links above. Everything
else is from memory and marked so. Ask for these hosts to be allowed:
help.blooket.com, blog.baamboozle.com, wordwall.net, www.figma.com,
www.nngroup.com, www.w3.org, m3.material.io, www.gameuidatabase.com.
