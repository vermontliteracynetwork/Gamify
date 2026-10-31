---
name: golden-rule
description: Gamify's GOLDEN RULE quality gate. MUST be used before building, redesigning or shipping any game, game screen, board, animation or power-up in Gamify, and again before calling it done. Lists the must-have properties every game needs and the steps that prove them.
---

# The Golden Rule (teacher, 2026-10-31)

It governs ALL game design: every new game, redesign, theme, board,
animation, power-up and fix, and every review of a game already shipped.

A Gamify game ships only when a kid would pick it over a popular classroom
game and a teacher would run it live without a second thought. "It works" is
not the bar. Built-to-spec-but-dull is a failure. Every property below is a
MUST HAVE; one miss means the game is not done.

## Before building: get the brief exactly right
0. Read docs/teacher-preferences.md and apply every line that fits without
   being asked. She should never have to repeat a preference.
1. Find the teacher's ORIGINAL request word for word (session transcript,
   queued messages, dev plan) and every reference image she sent. Save the
   images to the scratchpad and look at them.
2. Write the brief as a checklist of her exact asks (shape of the board,
   pieces, rules, every power-up and what its animation looks like). Nothing
   she asked for is dropped, swapped or "simplified" without asking.
3. Look at how the best-known games of that genre feel (board games, mobile
   hits, the reference classroom games) and note what makes them fun:
   anticipation, surprise, juice, clear goal, comeback chances.
4. Use the assets she gave first. Unzip every pack and look at the pieces
   before drawing anything yourself.

## Must-have properties (every game)
- **Matches the brief and references.** Side by side with her reference
  images, a stranger would say "that's the same idea".
- **Reads at a glance (K-3 lens).** Where to go, whose turn, what happened:
  shown by shape, color, motion and icon, never by numbers or paragraphs.
  No numbers on board spaces unless she asked for them.
- **A world, not a diagram.** Themed scenery, depth, layered art, light and
  shadow; the play area fills the screen; nothing looks like a placeholder.
- **Motion with weight.** Every move is animated step by step (hops, rolls,
  bounces, squash and stretch, easing). Nothing teleports. Frame-check it.
- **Surprise and irregularity.** Outcomes vary: wobble, spin, near misses,
  random events, lucky breaks and comebacks. Two turns never feel identical.
- **Juice on every action.** Sound, particles, screen feedback, a
  celebration sized to the moment; calm mode and reduced motion respected.
- **Power-ups that feel special.** Frequent, each with its own clear
  animation and sound, its art and its plain-words role; negative ones are
  fair and funny, never mean.
- **A goal that builds.** Progress is visible and grows (a castle rising,
  a sky filling), so the class feels the race tighten.
- **Learning stays central.** Every move is earned with a question; review
  of misses at the end; accuracy beats speed.
- **Teacher-proof.** Share and Versus on one device, CPU opponent, no
  scrolling, fits iPad portrait and landscape, laptop, smart board; menus and
  results in the standard Gamify look; zero console errors.
- **Licensed.** Every asset in docs/asset-ledger.md before it ships.

## Before calling it done
1. Run it in a real browser at every size and play a full game.
2. Screenshot the board next to her reference images and compare honestly.
3. Capture frames of every animation (moves, each power-up, the win).
4. Run the claudia-code-review agent on the game and fix what she flags.
5. Score each must-have above as pass or fail in the report. Any fail means
   keep building.
