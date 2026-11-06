---
name: bug-report
description: "Write a structured Gamify bug report from a description, a failing test or a playtest note: steps to reproduce on the right device, expected vs actual, severity for a live classroom, and the likely code. Use for 'X is broken', 'kids said Y happened', or to analyze a file for likely bugs."
argument-hint: "[description] | analyze <path>"
---

# Bug Report (Gamify)

Adapted from Claude Code Game Studios (MIT, see `.claude/THIRD_PARTY.md`).

## Description mode
1. Reproduce it first when you can: `npm run dev` and Playwright at the device it happened on
   (iPad portrait, iPad landscape or laptop). Save a screenshot and the console output.
2. Find the likely code with Grep.
3. Write:
```markdown
# Bug: [short title]
- Game / screen: [...]   Theme: [...]   Device: [...]   Found: [date, by whom]
- Severity: S1 class cannot play / S2 a student is stuck or a score is wrong /
  S3 looks wrong or confusing / S4 small polish
- Seen by students? [yes / no]   Happens every time? [yes / sometimes / once]

## Steps to reproduce
1. ...
## Expected
## Actual
## Evidence (screenshot, console errors, failing test)
## Likely cause (file:line) and suggested fix
```
4. Add it to the live dev plan doc (CLAUDE.md) the same turn; S1 and S2 go to the top of the
   current stage.
5. When fixing: write the failing test first (see the `qa-tester` agent), fix, show it passing,
   and run `npm run check`.

## analyze mode
Read the file and list likely bugs, each with file:line, what input breaks it, and severity.
Only list what you can point to in the code; mark guesses as guesses.
