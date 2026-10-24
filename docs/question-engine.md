# Question Engine (carried over from the Independent Work Dashboard)

The Dashboard's arcade games all share one question engine. Gamify rebuilds
that engine as its core, so every game only decides two things: **when to
ask** and **what a right answer does.** Source of truth for the original
behavior: the Dashboard's "Question Set Mini Games: How They Work" write-up
(`src/lib/questionPick.ts`, `src/components/QuestionScreen.tsx`,
`src/lib/gameRounds.ts`, `src/games/mini/useAsk.tsx` in that repo). This is
our own code and our own design, so reuse is fine; anything in the
Dashboard that came from a third party still has to pass the asset rules in
`product-plan.md` section 6.

## 1. Question sets
- A set has a name, questions, and an optional **focus star**.
- Question types that play in games: **multiple choice** (prompt, choices,
  correct index, optional image + alt text) and **typed** (build a
  sentence, fill in blanks). Typed questions show answer boxes instead of
  choice buttons.
- Picker: if any set is starred, all questions come from starred sets;
  otherwise every set is equally likely. Random set, then random question,
  avoiding an immediate repeat.
- Star can apply to all students or chosen students; support settings
  (for example capital letter / punctuation checks on typed answers) can
  differ per student.
- No sets at all: a generated fallback question (simple math) so a game
  never stalls.
- Optional source picker: "Random from all my sets" or "Just one set."

## 2. The question break
Each game chooses when it asks:
- **Before an action** (a hop, a swing, an ingredient)
- **Between rounds**
- **At the start of a player's turn** (multiplayer)
- **On a timer** (every N seconds in a runner, and after a crash)
- **Questions each time**: 1 or more in a row, with a "2 of 3" progress
  pill

## 3. The question screen (one design for every game)
- **Read first:** for 3 seconds answers show but cannot be tapped.
- **Shuffled answers** every time.
- **One try per question:** first tap locks.
- **Right:** short success moment, then continue.
- **Wrong:** marked wrong, the right answer is **not** shown, a new
  question comes after about 1.4 seconds. A wrong answer never costs
  anything. The student keeps going until one is right.
- **Listen** button reads question and choices with a human-sounding
  voice; storytelling games read aloud by default.
- **Tools:** calculator, scratchpad, text size (3 sizes, remembered),
  highlighter.
- **Card mode:** question card on one side so the game stays visible.
- **Whose turn** label in multiplayer; **Close** asks "are you sure."
- **Guessing check:** many fast wrong answers in a row opens a calm
  "take a breath" break.
- **Logging:** every question logged for the teacher (game, prompt,
  answers tapped, time, result).

Typed answers: 3 support levels (some words given, first letters given,
none) that move with how the student is doing; each box marked right or
wrong; punctuation is a tap-to-cycle square; long sentences shrink so
nothing scrolls on an iPad.

## 4. Rounds and settings
- Every game opens on a start card with up to two sliders: **Rounds** (or
  the game's own word, like "customers each shift") and **Questions per
  break**.
- Choice remembered per game on that device.
- **Assignment lock:** if the teacher assigned the game, the teacher's
  numbers are used and the sliders lock with a note saying so.
- The same sliders reopen mid-game from a settings button.
- Every game: sound on/off, and the student's reduce-motion setting calms
  all decorative animation.

Per-game defaults from the Dashboard (rounds min-max/default, questions per
break min-max/default) are listed in the original write-up and should be
copied into each module's manifest when that game is rebuilt.

## 5. Rewards and reporting
- One reward call when the student leaves or finishes: record it, show it,
  report it to the teacher.
- In-game points (stars, gems, XP) come from playing, never from
  answering wrong, and never take anything away.
- Dashboard-only parts Gamify replaces or makes optional: student login and
  roster, classroom money, daily streak, computer-player characters, Inbox
  reports, the "check on your pet" break, Supabase storage.

## 6. Teacher assignments through games
- Completion mode: plain quiz, one specific game, or any game.
- Target question count (default: whole set once; larger targets cycle).
- Assignment can lock game rounds and questions per break.
- Assignment questions come first; "counts for your assignment" tag on the
  question screen; "Assignment complete!" card with "Keep playing."

## 7. The hook every game uses
`useAsk` returns `ask(label, onRight)`, a reward/pay call, the settings
panel, the settings button and the question screen element. A new game
module calls `ask()` whenever it needs an answer and supplies what a right
answer does. Nothing else about questions lives in the game.
