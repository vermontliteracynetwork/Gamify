---
name: scope-check
description: "Compare what was built for a Gamify stage, game or feature against what the dev plan and the teacher's original request asked for. Flags additions, drops and swaps, and quantifies scope creep. Read-only report. Use before calling a stage done or when a build feels like it is growing."
argument-hint: "[stage number | game id | feature name]"
---

# Scope Check (Gamify)

Adapted from Claude Code Game Studios (MIT, see `.claude/THIRD_PARTY.md`). Read-only.

## 1. Baseline
Find what was asked for:
- the live dev plan doc ("Gamify Development Plan", see CLAUDE.md); fall back to
  `docs/development-plan.md` if the docs connector is missing
- the teacher's original words (transcript, dev plan quotes, `docs/teacher-preferences.md`)
- the `golden-rule` brief checklist if one was written

If the baseline cannot be found, or lists no concrete items, the verdict is NOT ASSESSED.
Never compute a percentage from an empty baseline.

## 2. Current state
Read the code (`src/games/<id>`, related `src/` files), `git log --oneline` for the work, and
open TODOs.

## 3. Compare
```
## Scope check: [name]  (date)
| Asked for | Built? | Notes |
| Added (not asked for) | Why | Size S/M/L | Keep / cut / ask |
| Dropped, swapped or simplified | Reason | Did she approve? |
Items asked: N   built: N   added: N (+X%)   dropped: N
```

## 4. Verdict
- **FAIL** if anything she asked for was dropped, swapped or simplified without her approval
  (the Golden Rule: nothing she asked for is dropped without asking), or additions are over 25%.
- **CONCERNS** if additions are 10-25%, or an addition changes how the game plays.
- **PASS** if everything asked was built and additions are under 10%.
- **NOT ASSESSED** if the baseline or the current state could not be read.

For FAIL or CONCERNS, list what to build, cut, or note in the dev plan as a guess (per
CLAUDE.md, predict her answer from past decisions and record the guess).
