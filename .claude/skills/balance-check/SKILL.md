---
name: balance-check
description: "Check a Gamify game's balance: scoring, rewards, power-ups, difficulty, timers and pacing for a class round. Finds degenerate strategies (winning without learning), dead stretches, runaway leaders and stingy or flooded rewards. Use when tuning a game or after adding a power-up. Report only."
argument-hint: "[game id, e.g. road-hop | path to a file]"
---

# Balance Check (Gamify)

Adapted from Claude Code Game Studios (MIT, see `.claude/THIRD_PARTY.md`).

## 0. Inputs, or "could not run"
List what you read and mark each FOUND or ABSENT: the game code (`src/games/<id>`), shared
engine (`src/engine`, `docs/question-engine.md`), its settings/modes (`src/games/modes.ts`),
and the brief (dev plan, `docs/teacher-preferences.md`, `golden-rule`). A section whose
inputs are missing is `NOT ASSESSED — NO DATA`. Never estimate numbers you did not read.

## 1. Pull the numbers
From the code: points per right answer, streak bonuses, power-up odds and effects, timers,
goal size, how losing a turn or a miss works, and every teacher setting that changes them.

## 2. Simulate class rounds
Use the question counts teachers really pick (for example 10, 20 and 30) and three players:
strong (90% right), average (70%), struggling (40%). For each, work out:
- answers until the first visible payoff, the first power-up, and the goal
- final standing gap between strong and struggling (is there a comeback chance?)
- time per round at the default timer

If the game is simple enough, write a tiny throwaway script in the scratchpad to run the
numbers instead of doing them by hand.

## 3. Look for problems
- **Degenerate strategy**: a way to win or farm rewards without answering correctly, or one
  power-up or choice that always beats the rest.
- **Dead stretch**: too many answers with nothing visible happening.
- **Runaway leader**: the leader can no longer be caught halfway through.
- **Stingy / flooded**: rewards so rare they feel absent, or so common they mean nothing.
- **Punishing**: a miss takes away earned progress from a young student.
- **Round does not fit**: the goal cannot finish at the shortest setting, or ends far too early
  at the longest.

## 4. Report
```
## Balance check: [game]  (date)
Sources read: [...]
Health: CRITICAL ISSUES / CONCERNS / NOT ASSESSED / HEALTHY
| Problem | Numbers | Who it hurts | Suggested fix | Teacher setting? |
```
CRITICAL ISSUES = a degenerate strategy, a round that cannot finish, or a miss that takes
progress away. CONCERNS = tuning fixes. NOT ASSESSED = missing inputs. HEALTHY only when
every number was judged.

Then fix what the report finds if you are building, and re-run the check. Balance changes
still go through the `golden-rule` skill and the Three-Lens Standard.
